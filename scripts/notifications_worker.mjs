import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { query } = await import('../modules/platform/db/postgres.ts');
const { claimNotifications, processNotification, recoverExpiredNotifications } = await import('../modules/platform/notifications-3/index.ts');

const workerId=process.env.TRUST_NOTIFICATION_WORKER_ID||`notifications-${process.pid}`;
const recovered=await recoverExpiredNotifications();
const rows=await claimNotifications(Number(process.env.TRUST_NOTIFICATION_BATCH||20),workerId);
const results=[];
for(const row of rows){
  try { results.push(await processNotification(row,[],workerId)); }
  catch(error){ await query(`update platform_notifications set status='FAILED',last_error=$2,updated_at=now() where id=$1 and status='PROCESSING'`,[row.id,error instanceof Error?error.message:'NOTIFICATION_WORKER_ERROR']); results.push({status:'FAILED',reason:'WORKER_ERROR'}); }
}
console.log(JSON.stringify({workerId,recovered,claimed:rows.length,results}));
