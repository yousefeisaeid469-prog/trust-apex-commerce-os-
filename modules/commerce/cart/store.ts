import { getProduct } from '../repository/catalog';
import type { CartLine } from '../core/service';
import { query, withPgTransaction } from '../../platform/db/postgres';
import { calculateCartTotals } from './experience-3';
import { getInventoryExecutionTruth } from '../inventory/execution-truth';

export interface StoredCart { id: string; customerId: string; items: CartLine[]; updatedAt: string }

function cleanCustomerId(id:string){ if(!id?.trim()) throw new Error('CUSTOMER_REQUIRED'); return id.trim(); }
function lineKey(line:Pick<CartLine,'productId'|'offerId'>){ return `${String(line.productId)}:${String(line.offerId??'')}`; }

async function normalize(items: CartLine[]) {
  const map = new Map<string,CartLine>();
  for(const line of items){
    if(!line || typeof line.productId !== 'string' || !Number.isInteger(line.qty) || line.qty < 1) throw new Error('INVALID_CART_LINE');
    const product=await getProduct(line.productId);
    if(!product) throw new Error('PRODUCT_NOT_FOUND');
    let offerId:string|undefined;
    if(line.offerId){
      const offer=(await query(`select id,stock,status from trust_marketplace_offers where id=$1 and product_id=$2 limit 1`,[line.offerId,line.productId])).rows[0];
      if(!offer || offer.status!=='ACTIVE') throw new Error('OFFER_NOT_AVAILABLE');
      offerId=String(offer.id);
      const truth=await getInventoryExecutionTruth(line.productId,String(offer.id));
      const available=truth?.canonicalAvailableUnits ?? Number(offer.stock);
      if(line.qty>available) throw new Error('INSUFFICIENT_OFFER_STOCK');
    } else if(line.qty>product.stock) throw new Error('INSUFFICIENT_STOCK');
    const key=lineKey({productId:line.productId,offerId});
    const existing=map.get(key);
    map.set(key,{productId:String(line.productId),qty:(existing?.qty??0)+line.qty,...(offerId?{offerId}:{})});
  }
  return [...map.values()];
}

async function ensureCart(clientOrQuery: { query: (sql: string, params?: readonly unknown[]) => Promise<any> }, customerId: string) {
  const result=await clientOrQuery.query(`insert into trust_carts(customer_id) values($1) on conflict(customer_id) do update set updated_at=trust_carts.updated_at returning id,customer_id,updated_at`, [customerId]);
  return result.rows[0];
}

export async function getCart(customerId:string):Promise<StoredCart> {
  const id=cleanCustomerId(customerId);
  const cart = await query(`select id,customer_id,updated_at from trust_carts where customer_id=$1 limit 1`,[id]);
  if(!cart.rows[0]) return {id:`cart_${id}`,customerId:id,items:[],updatedAt:new Date().toISOString()};
  const items = await query(`select product_id,quantity,offer_id from trust_cart_items where cart_id=$1 order by product_id,offer_id nulls first`,[cart.rows[0].id]);
  return {id:String(cart.rows[0].id),customerId:id,items:items.rows.map((r:any)=>({productId:String(r.product_id),qty:Number(r.quantity),...(r.offer_id?{offerId:String(r.offer_id)}:{})})),updatedAt:new Date(cart.rows[0].updated_at).toISOString()};
}

async function save(customerId:string, items:CartLine[]) {
  const normalized=await normalize(items);
  return withPgTransaction(async client=>{
    const cart=await ensureCart(client,customerId);
    await client.query(`delete from trust_cart_items where cart_id=$1`,[cart.id]);
    for(const line of normalized) await client.query(`insert into trust_cart_items(cart_id,product_id,quantity,offer_id) values($1,$2,$3,$4)`,[cart.id,line.productId,line.qty,line.offerId??null]);
    await client.query(`update trust_carts set updated_at=now() where id=$1`,[cart.id]);
    return {id:String(cart.id),customerId,items:normalized,updatedAt:new Date().toISOString()} as StoredCart;
  });
}

export async function replaceCart(customerId:string, items:CartLine[]){ return save(cleanCustomerId(customerId),items); }

export async function addToCart(customerId:string, productId:string, qty:number, offerId?:string){
  if(!Number.isInteger(qty)||qty<1) throw new Error('INVALID_QUANTITY');
  const product=await getProduct(productId); if(!product) throw new Error('PRODUCT_NOT_FOUND');
  if(offerId){
    const offer=(await query(`select stock,status from trust_marketplace_offers where id=$1 and product_id=$2 limit 1`,[offerId,productId])).rows[0];
    if(!offer||offer.status!=='ACTIVE') throw new Error('OFFER_NOT_AVAILABLE');
    const truth=await getInventoryExecutionTruth(productId,String(offerId)); const available=truth?.canonicalAvailableUnits ?? Number(offer.stock);
    if(qty>available) throw new Error('INVALID_QUANTITY');
  } else if(qty>product.stock) throw new Error('INVALID_QUANTITY');
  const cart=await getCart(customerId);
  const key=lineKey({productId,offerId});
  const existing=cart.items.find(x=>lineKey(x)===key);
  const next=existing
    ? cart.items.map(x=>lineKey(x)===key?{...x,qty:x.qty+qty}:x)
    : [...cart.items,{productId,qty,...(offerId?{offerId}:{})}];
  return save(customerId,next);
}

export async function updateCartLine(customerId:string, productId:string, qty:number, offerId?:string){
  if(!Number.isInteger(qty)||qty<0) throw new Error('INVALID_QUANTITY');
  const product=await getProduct(productId); if(!product) throw new Error('PRODUCT_NOT_FOUND');
  const cart=await getCart(customerId);
  const key=lineKey({productId,offerId});
  if(qty===0) return save(customerId,cart.items.filter(x=>lineKey(x)!==key));
  if(offerId){
    const offer=(await query(`select stock,status from trust_marketplace_offers where id=$1 and product_id=$2 limit 1`,[offerId,productId])).rows[0];
    if(!offer||offer.status!=='ACTIVE') throw new Error('OFFER_NOT_AVAILABLE');
    const truth=await getInventoryExecutionTruth(productId,String(offerId)); const available=truth?.canonicalAvailableUnits ?? Number(offer.stock);
    if(qty>available) throw new Error('INSUFFICIENT_OFFER_STOCK');
  } else if(qty>product.stock) throw new Error('INSUFFICIENT_STOCK');
  const exists=cart.items.some(x=>lineKey(x)===key);
  const items=exists?cart.items.map(x=>lineKey(x)===key?{...x,qty}:x):[...cart.items,{productId,qty,...(offerId?{offerId}:{})}];
  return save(customerId,items);
}

export async function clearCart(customerId:string){ return save(cleanCustomerId(customerId),[]); }

export async function cartSummary(customerId:string){
  const cart=await getCart(customerId); let subtotal=0; let invalid=0;
  const items=[];
  for(const line of cart.items){
    const p=await getProduct(line.productId);
    if(!p){invalid++; items.push({...line,name:'Unknown',unitPrice:0,lineTotal:0,stock:0}); continue;}
    let unitPrice=p.price; let availableStock=p.stock; let offerValid=true; let sellerId:string|undefined;
    if(line.offerId){
      const offer=(await query(`select price,stock,status,merchant_id from trust_marketplace_offers where id=$1 and product_id=$2 limit 1`,[line.offerId,line.productId])).rows[0];
      if(offer && offer.status==='ACTIVE'){unitPrice=Number(offer.price);const truth=await getInventoryExecutionTruth(line.productId,String(line.offerId));availableStock=truth?.canonicalAvailableUnits ?? Number(offer.stock);sellerId=String(offer.merchant_id);}
      else {offerValid=false;invalid++;}
    }
    const lineTotal=offerValid?unitPrice*line.qty:0; subtotal+=lineTotal;
    items.push({...line,name:p.name,unitPrice,lineTotal,stock:availableStock,image:p.image,sellerId,offerValid});
  }
  const totals=calculateCartTotals(items.map((item:any)=>({qty:Number(item.qty),unitPrice:Number(item.unitPrice)})));
  const stockWarnings=items.filter((item:any)=>!item.offerValid||Number(item.qty)>Number(item.stock)).map((item:any)=>lineKey(item));
  return {cart,items,...totals,invalidLines:invalid,stockWarnings,serverAuthoritative:true,multiSellerLines:items.filter((item:any)=>item.offerId).length};
}

export async function clearCartIfMatches(customerId:string, expectedItems:CartLine[]) {
  const id=cleanCustomerId(customerId);
  return withPgTransaction(async client=>{
    const cart=(await client.query(`select id from trust_carts where customer_id=$1 for update`,[id])).rows[0];
    if(!cart) return {cleared:false,reason:'CART_MISSING'};
    const rows=(await client.query(`select product_id,quantity,offer_id from trust_cart_items where cart_id=$1 order by product_id,offer_id nulls first`,[cart.id])).rows;
    const normalize=(items:any[])=>items.map(x=>({productId:String(x.product_id??x.productId),qty:Number(x.quantity??x.qty),offerId:x.offer_id??x.offerId??undefined})).sort((a,b)=>lineKey(a).localeCompare(lineKey(b)));
    const same=JSON.stringify(normalize(rows))===JSON.stringify(normalize(expectedItems));
    if(!same) return {cleared:false,reason:'CART_CHANGED'};
    await client.query(`delete from trust_cart_items where cart_id=$1`,[cart.id]);
    await client.query(`update trust_carts set updated_at=now() where id=$1`,[cart.id]);
    return {cleared:true,reason:'CLEARED'};
  });
}
