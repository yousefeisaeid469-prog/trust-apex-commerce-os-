import type { PoolClient } from 'pg';
import { assessFees, calculateFee } from './fee-engine';
import { appendPaymentLedgerTx } from './payment-ledger';

export type SellerSettlement = { merchantId:string; gross:number; platformFee:number; paymentFee:number; fulfillmentFee:number; returnFee:number; sellerNet:number };

const money=(n:number)=>Number(Math.max(0,Number(n)||0).toFixed(2));

async function appendRevenueTx(tx:PoolClient,input:{orderId?:string;merchantId?:string;surface:'COMMISSION'|'FULFILLMENT'|'PAYMENT_FEES';kind:'CHARGE'|'REFUND'|'ADJUSTMENT';amount:number;currency:string;referenceType:string;referenceId:string;idempotencyKey:string;metadata?:unknown}){
  const amount=money(input.amount);
  if(amount<=0)return;
  await tx.query(`insert into trust_revenue_ledger(order_id,merchant_id,surface,kind,amount,currency,reference_type,reference_id,idempotency_key,metadata_json) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb) on conflict(idempotency_key) do nothing`,[input.orderId??null,input.merchantId??null,input.surface,input.kind,amount,input.currency.toUpperCase(),input.referenceType,input.referenceId,input.idempotencyKey,JSON.stringify(input.metadata??{})]);
}

async function applicableRule(tx:PoolClient, merchantId:string, feeType:string, category:string|null){
  const r=await tx.query<{id:string;rate_bps:number;minimum_fee:string;maximum_fee:string|null;volume_threshold:string|null;volume_rate_bps:number|null;program_code:string}>(`
    select id,rate_bps,minimum_fee,maximum_fee,volume_threshold,volume_rate_bps,program_code
    from trust_marketplace_fee_rules
    where active=true and fee_type=$1
      and starts_at<=now() and (ends_at is null or ends_at>now())
      and (merchant_id=$2 or merchant_id is null)
      and (category=$3 or category is null)
    order by (merchant_id is not null) desc,(category is not null) desc,starts_at desc,id desc
    limit 1`,[feeType,merchantId,category]);
  return r.rows[0]??null;
}

export async function settleCapturedPaymentTx(tx:PoolClient,input:{paymentId:string;orderId:string;idempotencyKey:string}){
  const existing=await tx.query<{id:string;status:string}>(`select id,status from trust_marketplace_payment_settlements where payment_id=$1 for update`,[input.paymentId]);
  if(existing.rows[0]) return {settlementId:existing.rows[0].id,replay:true,status:existing.rows[0].status};

  const order=(await tx.query<{id:string;total:string;currency:string}>(`select id,total,currency from trust_orders where id=$1 for update`,[input.orderId])).rows[0];
  if(!order) throw new Error('ORDER_NOT_FOUND');
  const items=await tx.query<{merchant_id:string;product_id:string;category:string|null;line_gross:string;quantity:number;seller_order_id:string|null}>(`
    select coalesce(o.merchant_id,p.merchant_id) merchant_id,oi.product_id,p.category,
           round((oi.unit_price*oi.quantity)::numeric,2) line_gross,oi.quantity,oi.seller_order_id
    from trust_order_items oi
    join trust_products p on p.id=oi.product_id
    left join trust_marketplace_offers o on o.id=oi.offer_id
    where oi.order_id=$1
    order by oi.id`,[input.orderId]);
  if(!items.rows.length) throw new Error('ORDER_ITEMS_NOT_FOUND');

  const sellerOrders=await tx.query<{id:string;merchant_id:string;subtotal:string;discount:string;shipping:string;total:string;currency:string}>(`
    select id,merchant_id,subtotal,discount,shipping,total,currency
    from trust_seller_orders where order_id=$1 for update`,[input.orderId]);
  if(!sellerOrders.rows.length) throw new Error('SELLER_ORDERS_NOT_FOUND');

  const groups=new Map<string,{gross:number;feeBase:number;category:string|null;sellerOrderId:string}>();
  for(const row of items.rows){
    if(!row.merchant_id) throw new Error('ORDER_MERCHANT_NOT_FOUND');
    if(!row.seller_order_id) throw new Error('ORDER_ITEM_SELLER_ORDER_MISSING');
    const so=sellerOrders.rows.find(x=>String(x.id)===String(row.seller_order_id));
    if(!so || String(so.merchant_id)!==String(row.merchant_id)) throw new Error('SELLER_ORDER_ITEM_BINDING_MISMATCH');
    const g=groups.get(row.merchant_id)??{gross:Number(so.total),feeBase:0,category:row.category,sellerOrderId:String(so.id)};
    g.feeBase=money(g.feeBase+Number(row.line_gross));
    groups.set(row.merchant_id,g);
  }
  const sellerOrderTotal=money(sellerOrders.rows.reduce((n,x)=>n+Number(x.total),0));
  if(Math.abs(sellerOrderTotal-Number(order.total))>0.01) throw new Error('SELLER_ORDER_TOTALS_DO_NOT_BALANCE_ORDER');
  if(sellerOrders.rows.some(x=>String(x.currency).toUpperCase()!==String(order.currency).toUpperCase())) throw new Error('SELLER_ORDER_CURRENCY_MISMATCH');

  const settlements:SellerSettlement[]=[];
  let platformFeeTotal=0,paymentFeeTotal=0,fulfillmentFeeTotal=0,returnFeeTotal=0,sellerNetTotal=0,merchandiseGrossTotal=0;
  for(const [merchantId,g] of groups){
    const rules=[] as Array<any>;
    for(const feeType of ['REFERRAL','PAYMENT','FULFILLMENT','RETURN']){ const r=await applicableRule(tx,merchantId,feeType,g.category); if(r) rules.push({feeType,rateBps:Number(r.rate_bps),minimumFee:Number(r.minimum_fee),maximumFee:r.maximum_fee==null?undefined:Number(r.maximum_fee),volumeThreshold:r.volume_threshold==null?undefined:Number(r.volume_threshold),volumeRateBps:r.volume_rate_bps==null?undefined:Number(r.volume_rate_bps),ruleId:r.id,programCode:r.program_code}); }
    const assessed=assessFees({baseAmount:g.feeBase,programCode:'ORDER_SETTLEMENT',category:g.category??undefined,rules});
    let platformFee=0,paymentFee=0,fulfillmentFee=0,returnFee=0;
    for(const a of assessed){
      const rule=rules.find(x=>x.feeType===a.feeType); const fee=money(a.feeAmount);
      await tx.query(`insert into trust_marketplace_fee_assessments(order_id,merchant_id,fee_type,program_code,base_amount,rate_bps,fee_amount,currency,rule_id,idempotency_key) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict(merchant_id,idempotency_key) do nothing`,[input.orderId,merchantId,a.feeType,a.programCode,a.baseAmount,a.rateBps,fee,order.currency,rule?.ruleId??null,`${input.idempotencyKey}:fee:${merchantId}:${a.feeType}`]);
      await tx.query(`insert into trust_marketplace_fee_ledger(merchant_id,order_id,seller_order_id,fee_type,program_code,base_amount,rate_bps,fee_amount,currency,idempotency_key) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict(merchant_id,idempotency_key) do nothing`,[merchantId,input.orderId,g.sellerOrderId,a.feeType,a.programCode,a.baseAmount,a.rateBps,fee,order.currency,`${input.idempotencyKey}:fee-ledger:${merchantId}:${a.feeType}`]);
      if(a.feeType==='REFERRAL') platformFee=money(platformFee+fee); else if(a.feeType==='PAYMENT') paymentFee=money(paymentFee+fee); else if(a.feeType==='FULFILLMENT') fulfillmentFee=money(fulfillmentFee+fee); else if(a.feeType==='RETURN') returnFee=money(returnFee+fee);
    }
    const sellerNet=money(Math.max(0,g.gross-platformFee-paymentFee-fulfillmentFee-returnFee));
    settlements.push({merchantId,gross:g.gross,platformFee,paymentFee,fulfillmentFee,returnFee,sellerNet});
    platformFeeTotal=money(platformFeeTotal+platformFee); paymentFeeTotal=money(paymentFeeTotal+paymentFee); fulfillmentFeeTotal=money(fulfillmentFeeTotal+fulfillmentFee); returnFeeTotal=money(returnFeeTotal+returnFee); sellerNetTotal=money(sellerNetTotal+sellerNet); merchandiseGrossTotal=money(merchandiseGrossTotal+g.gross);
    await appendPaymentLedgerTx(tx,{orderId:input.orderId,paymentId:input.paymentId,merchantId,entryType:'SELLER_CREDIT',amount:sellerNet,direction:'CREDIT',currency:order.currency,idempotencyKey:`${input.idempotencyKey}:seller:${merchantId}`});
    await appendPaymentLedgerTx(tx,{orderId:input.orderId,paymentId:input.paymentId,entryType:'PLATFORM_FEE',amount:platformFee,direction:'CREDIT',currency:order.currency,idempotencyKey:`${input.idempotencyKey}:platform:${merchantId}`});
    await appendPaymentLedgerTx(tx,{orderId:input.orderId,paymentId:input.paymentId,merchantId,entryType:'PAYMENT_FEE',amount:paymentFee,direction:'DEBIT',currency:order.currency,idempotencyKey:`${input.idempotencyKey}:payment-fee:${merchantId}`});
    await appendRevenueTx(tx,{orderId:input.orderId,merchantId,surface:'COMMISSION',kind:'CHARGE',amount:platformFee,currency:order.currency,referenceType:'ORDER_SETTLEMENT',referenceId:input.orderId,idempotencyKey:`revenue:${input.idempotencyKey}:commission:${merchantId}`,metadata:{feeType:'REFERRAL'}});
    await appendRevenueTx(tx,{orderId:input.orderId,merchantId,surface:'PAYMENT_FEES',kind:'CHARGE',amount:paymentFee,currency:order.currency,referenceType:'ORDER_SETTLEMENT',referenceId:input.orderId,idempotencyKey:`revenue:${input.idempotencyKey}:payment-fee:${merchantId}`,metadata:{feeType:'PAYMENT'}});
    if(fulfillmentFee>0) await appendPaymentLedgerTx(tx,{orderId:input.orderId,paymentId:input.paymentId,entryType:'PLATFORM_FEE',amount:fulfillmentFee,direction:'CREDIT',currency:order.currency,idempotencyKey:`${input.idempotencyKey}:fulfillment:${merchantId}`});
    if(returnFee>0) await appendPaymentLedgerTx(tx,{orderId:input.orderId,paymentId:input.paymentId,entryType:'PLATFORM_FEE',amount:returnFee,direction:'CREDIT',currency:order.currency,idempotencyKey:`${input.idempotencyKey}:return:${merchantId}`});
    if(fulfillmentFee>0) await appendRevenueTx(tx,{orderId:input.orderId,merchantId,surface:'FULFILLMENT',kind:'CHARGE',amount:fulfillmentFee,currency:order.currency,referenceType:'ORDER_SETTLEMENT',referenceId:input.orderId,idempotencyKey:`revenue:${input.idempotencyKey}:fulfillment:${merchantId}`,metadata:{feeType:'FULFILLMENT'}});
    const existingBalance=await tx.query<{currency:string}>(`select currency from trust_marketplace_seller_balances where merchant_id=$1 for update`,[merchantId]);
    if(existingBalance.rows[0] && existingBalance.rows[0].currency!==order.currency)throw new Error('SELLER_BALANCE_CURRENCY_MISMATCH');
    await tx.query(`insert into trust_marketplace_seller_balances(merchant_id,pending_balance,available_balance,held_balance,currency) values($1,$2,0,0,$3) on conflict(merchant_id) do update set pending_balance=trust_marketplace_seller_balances.pending_balance+excluded.pending_balance,updated_at=now()`,[merchantId,sellerNet,order.currency]);
    await tx.query(`insert into trust_seller_order_financials(seller_order_id,merchant_id,settlement_id,payment_id,gross_amount,gross_customer_amount,seller_credit_amount,released_amount,platform_fee_amount,payment_fee_amount,fulfillment_fee_amount,return_fee_amount,currency,status) values($1,$2,null,$3,$4,$4,$5,0,$6,$7,$8,$9,$10,'PENDING') on conflict(seller_order_id) do update set payment_id=excluded.payment_id,gross_amount=excluded.gross_amount,gross_customer_amount=excluded.gross_customer_amount,seller_credit_amount=excluded.seller_credit_amount,platform_fee_amount=excluded.platform_fee_amount,payment_fee_amount=excluded.payment_fee_amount,fulfillment_fee_amount=excluded.fulfillment_fee_amount,return_fee_amount=excluded.return_fee_amount,currency=excluded.currency,updated_at=now()`,[g.sellerOrderId,merchantId,input.paymentId,g.gross,sellerNet,platformFee,paymentFee,fulfillmentFee,returnFee,order.currency]);
  }
  await appendPaymentLedgerTx(tx,{orderId:input.orderId,paymentId:input.paymentId,entryType:'CUSTOMER_CHARGE',amount:money(Number(order.total)),direction:'CREDIT',currency:order.currency,idempotencyKey:`${input.idempotencyKey}:customer`});
  const accountingDelta=money(Math.max(0,Number(order.total)-sellerNetTotal-platformFeeTotal-paymentFeeTotal-fulfillmentFeeTotal-returnFeeTotal));
  if(accountingDelta>0.01) throw new Error('SETTLEMENT_ACCOUNTING_DOES_NOT_BALANCE');
  const settlement=await tx.query<{id:string}>(`insert into trust_marketplace_payment_settlements(payment_id,order_id,gross_amount,merchandise_gross,seller_net,platform_fee,payment_fee,fulfillment_fee,return_fee,seller_order_count,accounting_delta,currency,status,idempotency_key) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'PENDING',$12) on conflict(payment_id) do nothing returning id`,[input.paymentId,input.orderId,Number(order.total),merchandiseGrossTotal,sellerNetTotal,platformFeeTotal,paymentFeeTotal,fulfillmentFeeTotal,returnFeeTotal,groups.size,accountingDelta,order.currency,input.idempotencyKey]);
  if(!settlement.rows[0]){ const prior=await tx.query<{id:string;status:string}>(`select id,status from trust_marketplace_payment_settlements where payment_id=$1`,[input.paymentId]); return {settlementId:prior.rows[0].id,replay:true,status:prior.rows[0].status}; }
  await tx.query(`update trust_seller_order_financials set settlement_id=$1,updated_at=now() where payment_id=$2`,[settlement.rows[0].id,input.paymentId]);
  await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('marketplace.payment.settled',$1,$2::jsonb)`,[input.orderId,JSON.stringify({paymentId:input.paymentId,orderId:input.orderId,settlementId:settlement.rows[0].id,sellers:settlements})]);
  return {settlementId:settlement.rows[0].id,replay:false,status:'PENDING',sellers:settlements};
}
