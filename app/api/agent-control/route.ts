import { controlSnapshot, setKillSwitch, setAgentState, sendMessage, requestApproval, resolveApproval, authorize } from '../../../modules/agents/control-plane';
import type { AgentId, AgentRisk } from '../../../modules/agents/contracts';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '../../../modules/platform/admin/access';

async function requireAdmin(req: Request) {
  const cookie = req.headers.get('cookie')?.match(new RegExp(`${ADMIN_SESSION_COOKIE}=([^;]+)`))?.[1] ?? null;
  return verifyAdminSession(cookie);
}
export const dynamic='force-dynamic';
export async function GET(req:Request){const admin=await requireAdmin(req);if(!admin)return Response.json({error:'Unauthorized'},{status:401});return Response.json({...await controlSnapshot(),actor:admin.email},{headers:{'Cache-Control':'no-store'}})}
export async function POST(req:Request){const admin=await requireAdmin(req);if(!admin)return Response.json({error:'Unauthorized'},{status:401});const b=await req.json().catch(()=>({}));
 if(b.action==='kill-switch') return Response.json({...await setKillSwitch(Boolean(b.enabled)),actor:admin.email});
 if(b.action==='state'&&typeof b.agentId==='string'&&typeof b.state==='string') return Response.json({policy:await setAgentState(b.agentId as AgentId,b.state),actor:admin.email});
 if(b.action==='message'&&typeof b.from==='string'&&typeof b.to==='string'&&typeof b.task==='string') return Response.json(await sendMessage(b.from as AgentId,b.to as AgentId,b.task,b.type||'REQUEST'));
 if(b.action==='approval'&&typeof b.id==='string'&&typeof b.approved==='boolean') return Response.json(await resolveApproval(b.id,b.approved));
 if(b.action==='request-approval'&&typeof b.id==='string') return Response.json({state:await requestApproval(b.id)});
 if(b.action==='authorize'&&typeof b.agentId==='string'&&typeof b.tool==='string'&&typeof b.risk==='string') return Response.json(await authorize(b.agentId as AgentId,b.tool,b.risk as AgentRisk));
 return Response.json({error:'INVALID_CONTROL_ACTION'},{status:400});}
