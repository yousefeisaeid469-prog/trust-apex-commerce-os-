import { query } from '../../platform/db/postgres';
export type Review={id:string;productId:string;customerId:string;rating:number;title?:string;body?:string;createdAt:string};
export async function addReview(input:Omit<Review,'id'|'createdAt'>){
  if(!Number.isInteger(input.rating)||input.rating<1||input.rating>5)throw new Error('INVALID_RATING');
  const result=await query(`insert into trust_reviews(product_id,customer_id,rating,title,body) values($1,$2,$3,$4,$5) returning id,product_id,customer_id,rating,title,body,created_at`,[input.productId,input.customerId,input.rating,input.title??null,input.body??null]);
  const r=result.rows[0]; return {id:String(r.id),productId:String(r.product_id),customerId:String(r.customer_id),rating:Number(r.rating),title:r.title??undefined,body:r.body??undefined,createdAt:new Date(r.created_at).toISOString()};
}
export async function productReviews(productId:string){const result=await query(`select id,product_id,customer_id,rating,title,body,created_at from trust_reviews where product_id=$1 order by created_at desc`,[productId]);return result.rows.map((r:any)=>({id:String(r.id),productId:String(r.product_id),customerId:String(r.customer_id),rating:Number(r.rating),title:r.title??undefined,body:r.body??undefined,createdAt:new Date(r.created_at).toISOString()}));}
