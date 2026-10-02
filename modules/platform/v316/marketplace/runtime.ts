import { query, withPgTransaction } from '../../../platform/db/postgres';
import { planMarketplaceRun } from './engine.ts';
import type {MarketplaceCommand,MarketplaceRun} from './contracts.ts';

type Row={id:string;status:string;fingerprint:string;workflow_json:any};

export async function executeMarketplaceRun(command:MarketplaceCommand):Promise<MarketplaceRun>{
  const plan=planMarketplaceRun(command);
  return withPgTransaction(async client=>{
    const existing=await client.query<Row>(`select id,status,fingerprint,workflow_json from trust_v316_marketplace_runs where idempotency_key=$1 for update`,[command.idempotencyKey]);
    if(existing.rows[0]){
      if(existing.rows[0].fingerprint!==plan.fingerprint) throw new Error('MARKETPLACE_IDEMPOTENCY_CONFLICT');
      return existing.rows[0].workflow_json as MarketplaceRun;
    }
    const tenant=await client.query(`select id,state from trust_tenants where id=$1`,[command.tenantId]);
    if(!tenant.rows[0]||tenant.rows[0].state!=='active') throw new Error('TENANT_NOT_ACTIVE');
    const seller=await client.query(`select id,verification_status from trust_merchant_profiles where id=$1`,[command.sellerId]);
    if(!seller.rows[0]||seller.rows[0].verification_status!=='verified') throw new Error('SELLER_NOT_VERIFIED');
    const offer=await client.query(`select id,product_id,merchant_id,price,stock,status from trust_marketplace_offers where id=$1 for update`,[command.offerId]);
    if(!offer.rows[0]||offer.rows[0].status!=='ACTIVE') throw new Error('OFFER_NOT_ACTIVE');
    if(String(offer.rows[0].product_id)!==command.productId||String(offer.rows[0].merchant_id)!==command.sellerId) throw new Error('OFFER_OWNERSHIP_MISMATCH');
    if(Number(offer.rows[0].stock)<command.quantity) throw new Error('INSUFFICIENT_OFFER_STOCK');
    const row=await client.query(`insert into trust_v316_marketplace_runs(tenant_id,seller_id,customer_id,product_id,offer_id,idempotency_key,status,fingerprint,workflow_json) values($1,$2,$3,$4,$5,$6,'READY',$7,$8::jsonb) returning id`,[command.tenantId,command.sellerId,command.customerId,command.productId,command.offerId,command.idempotencyKey,plan.fingerprint,JSON.stringify(plan)]);
    await client.query(`insert into trust_v316_marketplace_events(run_id,event_type,payload_json) values($1,'MARKETPLACE_RUN_CREATED',$2::jsonb)`,[row.rows[0].id,JSON.stringify(plan)]);
    return plan;
  });
}

export async function getMarketplaceRun(idempotencyKey:string){
  const r=await query(`select workflow_json from trust_v316_marketplace_runs where idempotency_key=$1`,[idempotencyKey]);
  return (r.rows[0]?.workflow_json ?? undefined) as MarketplaceRun|undefined;
}
