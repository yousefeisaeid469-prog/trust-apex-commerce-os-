import { NextResponse } from 'next/server';
import { databaseConfigured, query } from '../../../../modules/platform/db/postgres';
import { TRUST_VERSION_NUMBER } from '../../../../lib/runtime/version';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  if (!databaseConfigured()) return NextResponse.json({ ok:false, status:'not_ready', version:TRUST_VERSION_NUMBER, error:'DATABASE_NOT_CONFIGURED' }, { status:503, headers:{'cache-control':'no-store'} });
  try {
    const [queue, heartbeat, publisher] = await Promise.all([
      query<any>(`select count(*) filter(where status in ('PENDING','WAITING'))::int pending,count(*) filter(where status='PROCESSING')::int processing,count(*) filter(where status='DEAD')::int dead,min(available_at) filter(where status in ('PENDING','WAITING')) next_available_at from trust_commerce_execution_jobs`),
      query<any>(`select last_started_at,last_finished_at,last_success_at,last_failure_at,last_worker_id,last_trigger,last_region,last_claimed,last_succeeded,last_waiting,last_failed,last_dead,last_recovered,last_error_code,updated_at from trust_commerce_worker_heartbeat where singleton=true`),
      query<any>(`select h.last_started_at,h.last_finished_at,h.last_success_at,h.last_failure_at,h.last_worker_id,h.last_trigger,h.last_claimed,h.last_published,h.last_retried,h.last_dead,h.last_failed,h.last_error,h.updated_at,q.ready,q.processing,q.dead,q.next_available_at from trust_commerce_event_publisher_heartbeat h cross join lateral (select count(*) filter(where status in ('pending','failed') and available_at<=now())::int ready,count(*) filter(where status='processing')::int processing,count(*) filter(where status='dead')::int dead,min(available_at) filter(where status in ('pending','failed')) next_available_at from trust_outbox_events) q where h.singleton=true`),
    ]);
    const q=queue.rows[0] ?? {};
    const h=heartbeat.rows[0] ?? {};
    const p=publisher.rows[0] ?? {};
    const publisherStale = !p.last_finished_at || (Date.now()-new Date(p.last_finished_at).getTime() > 36*60*60*1000);
    const stale = !h.last_finished_at || (Date.now()-new Date(h.last_finished_at).getTime() > 36*60*60*1000);
    const ok = Number(q.dead||0) === 0 && !stale && Number(p.dead||0) === 0 && !publisherStale;
    return NextResponse.json({ ok, status: ok?'healthy':'degraded', version:TRUST_VERSION_NUMBER, queue:{pending:Number(q.pending||0),processing:Number(q.processing||0),dead:Number(q.dead||0),nextAvailableAt:q.next_available_at??null}, worker:{...h,stale}, publisher:{...p,stale:publisherStale} }, { status:ok?200:503, headers:{'cache-control':'no-store'} });
  } catch (error) {
    return NextResponse.json({ ok:false,status:'unknown',version:TRUST_VERSION_NUMBER,error:error instanceof Error?error.message:'COMMERCE_HEALTH_FAILED' }, { status:503, headers:{'cache-control':'no-store'} });
  }
}
