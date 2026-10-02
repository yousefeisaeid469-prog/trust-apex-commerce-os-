import {eventSnapshot} from '../../../modules/platform/event-bus';
import {jobSnapshot} from '../../../modules/platform/jobs';
import {workflowSnapshot} from '../../../modules/platform/workflows';
import {notificationSnapshot} from '../../../modules/platform/notifications';
import {searchSnapshot} from '../../../modules/platform/search';
import {platformConfig,platformFeatureEnabled} from '../../../modules/platform/config';
import {ADMIN_SESSION_COOKIE,verifyAdminSession} from '../../../modules/platform/admin/access';
export const dynamic='force-dynamic';
async function admin(req:Request){const c=req.headers.get('cookie')?.match(new RegExp(`${ADMIN_SESSION_COOKIE}=([^;]+)`))?.[1]??null;return verifyAdminSession(c)}
export async function GET(req:Request){const a=await admin(req);if(!a)return Response.json({error:'Unauthorized'},{status:401});return Response.json({platform:platformConfig,modules:{eventBus:{enabled:platformFeatureEnabled('event_bus'),recent:eventSnapshot()},workflows:{enabled:platformFeatureEnabled('workflow_engine'),...workflowSnapshot()},jobs:{enabled:platformFeatureEnabled('background_jobs'),items:jobSnapshot()},notifications:{enabled:platformFeatureEnabled('notifications'),...notificationSnapshot()},search:{enabled:platformFeatureEnabled('search_index'),...searchSnapshot()},observability:{enabled:true,requestTracing:true,structuredLogs:true},secrets:{serverOnly:true}},actor:a.email},{headers:{'Cache-Control':'no-store'}})}
