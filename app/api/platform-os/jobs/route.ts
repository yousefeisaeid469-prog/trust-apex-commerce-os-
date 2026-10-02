import { NextRequest } from 'next/server';
import { enqueue, transition, jobSnapshot, claim } from '../../../../modules/platform/jobs';
import { requirePermission, AuthRequiredError, ForbiddenError } from '../../../../modules/platform/auth/current-user';

export const dynamic='force-dynamic';

export async function GET(req:NextRequest){
  try { await requirePermission(req,'platform:operate'); return Response.json({ok:true,jobs:await jobSnapshot()},{headers:{'Cache-Control':'no-store'}}); }
  catch(e){ const status=e instanceof AuthRequiredError?401:e instanceof ForbiddenError?403:500; return Response.json({ok:false,error:e instanceof Error?e.message:'JOB_ERROR'},{status}); }
}
export async function POST(req:NextRequest){
  try {
    await requirePermission(req,'platform:operate');
    const b=await req.json().catch(()=>({}));
    if(b.action==='enqueue'&&typeof b.type==='string') return Response.json({ok:true,job:await enqueue(b.type,b.payload??{},Number.isInteger(b.maxAttempts)?b.maxAttempts:5)},{status:201});
    if(b.action==='transition'&&typeof b.id==='string'&&typeof b.state==='string') return Response.json({ok:true,job:await transition(b.id,b.state,b.error)});
    if(b.action==='claim') return Response.json({ok:true,jobs:await claim(Number.isInteger(b.limit)?b.limit:20)});
    return Response.json({ok:false,error:'INVALID_JOB_ACTION'},{status:400});
  } catch(e) { const status=e instanceof AuthRequiredError?401:e instanceof ForbiddenError?403:e instanceof Error&&e.message==='DATABASE_NOT_CONFIGURED'?503:400; return Response.json({ok:false,error:e instanceof Error?e.message:'JOB_ERROR'},{status}); }
}
