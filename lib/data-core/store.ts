import { query } from '../../modules/platform/db/postgres';
import type { MerchantRecord, OrderRecord, ProductRecord, EntityMeta } from './types';
import type { Repository } from './repository';

function requireProductionDb() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_NOT_CONFIGURED');
}
function meta(row:any): EntityMeta { const now = new Date(row.updated_at ?? row.created_at ?? Date.now()).toISOString(); return { id:String(row.id), createdAt:new Date(row.created_at ?? now).toISOString(), updatedAt:now, version:1 }; }

const productRepository: Repository<ProductRecord> = {
  async list(){ requireProductionDb(); const r=await query<any>(`select id,name,category,price,stock,merchant_id,active,created_at,updated_at from trust_products order by updated_at desc limit 1000`); return r.rows.map((x:any)=>({...meta(x),name:String(x.name),category:String(x.category),price:Number(x.price),stock:Number(x.stock),merchantId:String(x.merchant_id),status:x.active?'active':'archived'})); },
  async get(id){ requireProductionDb(); const r=await query<any>(`select id,name,category,price,stock,merchant_id,active,created_at,updated_at from trust_products where id=$1`,[id]); const x=r.rows[0]; return x?({...meta(x),name:String(x.name),category:String(x.category),price:Number(x.price),stock:Number(x.stock),merchantId:String(x.merchant_id),status:x.active?'active':'archived'}):null; },
  async put(){ throw new Error('READ_ONLY_DATA_CORE: use commerce repository'); }, async remove(){ throw new Error('READ_ONLY_DATA_CORE: use commerce repository'); }
};
const merchantRepository: Repository<MerchantRecord> = {
  async list(){ requireProductionDb(); const r=await query<any>(`select id,store_name as name,region,verification_status,created_at,updated_at from trust_merchant_profiles order by updated_at desc limit 1000`); return r.rows.map((x:any)=>({...meta(x),name:String(x.name),region:String(x.region??''),trustScore:0,status:x.verification_status==='SUSPENDED'?'suspended':x.verification_status==='REVIEW'?'review':'active'})); },
  async get(id){ requireProductionDb(); const r=await query<any>(`select id,store_name as name,region,verification_status,created_at,updated_at from trust_merchant_profiles where id=$1`,[id]); const x=r.rows[0]; return x?({...meta(x),name:String(x.name),region:String(x.region??''),trustScore:0,status:x.verification_status==='SUSPENDED'?'suspended':x.verification_status==='REVIEW'?'review':'active'}):null; },
  async put(){ throw new Error('READ_ONLY_DATA_CORE: use merchant services'); }, async remove(){ throw new Error('READ_ONLY_DATA_CORE: use merchant services'); }
};
const orderRepository: Repository<OrderRecord> = {
  async list(){ requireProductionDb(); const r=await query<any>(`select o.id,o.customer_id,o.total,o.currency,o.status,o.created_at,o.updated_at,count(oi.id)::int as line_count from trust_orders o left join trust_order_items oi on oi.order_id=o.id group by o.id order by o.updated_at desc limit 1000`); return r.rows.map((x:any)=>({...meta(x),customerId:String(x.customer_id??'guest'),total:Number(x.total),currency:x.currency==='USD'?'USD':'EGP',status:x.status==='delivered'?'fulfilled':x.status==='confirmed'?'paid':x.status as OrderRecord['status'],lineCount:Number(x.line_count)})); },
  async get(id){ requireProductionDb(); const r=await query<any>(`select o.id,o.customer_id,o.total,o.currency,o.status,o.created_at,o.updated_at,count(oi.id)::int as line_count from trust_orders o left join trust_order_items oi on oi.order_id=o.id where o.id=$1 group by o.id`,[id]); const x=r.rows[0]; return x?({...meta(x),customerId:String(x.customer_id??'guest'),total:Number(x.total),currency:x.currency==='USD'?'USD':'EGP',status:x.status==='delivered'?'fulfilled':x.status==='confirmed'?'paid':x.status as OrderRecord['status'],lineCount:Number(x.line_count)}):null; },
  async put(){ throw new Error('READ_ONLY_DATA_CORE: use checkout/order services'); }, async remove(){ throw new Error('READ_ONLY_DATA_CORE: use order services'); }
};
export { productRepository, merchantRepository, orderRepository };
