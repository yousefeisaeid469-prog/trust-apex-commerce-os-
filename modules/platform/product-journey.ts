import { query, withPgTransaction } from './db/postgres';

export const PRODUCT_JOURNEY_CHECKPOINTS = [
  'SELLER_REGISTERED','STORE_CREATED','PRODUCT_CREATED','BUYER_REGISTERED','CART_UPDATED',
  'CHECKOUT_COMMITTED','PAYMENT_CAPTURED','FULFILLMENT_STARTED','DELIVERED','SELLER_BALANCE_UPDATED'
] as const;

export async function startProductJourney(input:{journeyKey:string;buyerId:string;merchantId:string}) {
  return withPgTransaction(async client=>{
    const row=(await client.query(`insert into trust_product_journeys(journey_key,buyer_id,merchant_id,status) values($1,$2,$3,'STARTED') on conflict(journey_key) do update set updated_at=now() returning *`,[input.journeyKey,input.buyerId,input.merchantId])).rows[0];
    return row;
  });
}

export async function recordProductJourneyCheckpoint(input:{journeyId:string;checkpoint:string;referenceId?:string;metadata?:unknown}) {
  if(!PRODUCT_JOURNEY_CHECKPOINTS.includes(input.checkpoint as any)) throw new Error('UNKNOWN_PRODUCT_JOURNEY_CHECKPOINT');
  const row=await query(`insert into trust_product_journey_checkpoints(journey_id,checkpoint,reference_id,metadata_json) values($1,$2,$3,$4::jsonb) on conflict(journey_id,checkpoint) do update set reference_id=excluded.reference_id,metadata_json=excluded.metadata_json,observed_at=now() returning *`,[input.journeyId,input.checkpoint,input.referenceId??null,JSON.stringify(input.metadata??{})]);
  return row.rows[0];
}

export async function getProductJourney(journeyId:string) {
  const journey=await query(`select * from trust_product_journeys where id=$1`,[journeyId]);
  if(!journey.rows[0]) return undefined;
  const checkpoints=await query(`select * from trust_product_journey_checkpoints where journey_id=$1 order by observed_at asc`,[journeyId]);
  return {journey:journey.rows[0],checkpoints:checkpoints.rows};
}
