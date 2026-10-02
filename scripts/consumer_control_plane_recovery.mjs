import { databaseConfigured } from '../modules/platform/db/postgres.ts';
import { captureConsumerHealthSnapshots, recoverStaleConsumerDeliveries } from '../modules/platform/durable-events/consumer-control-plane.ts';
if(!databaseConfigured()){console.error('DATABASE_NOT_CONFIGURED');process.exit(2)}
const recovery=await recoverStaleConsumerDeliveries(process.env.TRUST_COMMERCE_CONSUMER_ID || undefined);
const health=await captureConsumerHealthSnapshots();
console.log(JSON.stringify({ok:true,recovery,health},null,2));
