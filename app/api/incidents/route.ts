import {NextResponse} from 'next/server';
import { requireAdminSession } from '../../../modules/platform/security/route-auth';
export async function POST(req:Request){try{await requireAdminSession(req);return NextResponse.json({mode:'simulation',persisted:false,accepted:true,status:'triage',remediation:'reversible-plan',approvalRequired:true,audit:'persisted'})}catch(e){return NextResponse.json({ok:false,error:e instanceof Error&&e.message==='ADMIN_AUTH_REQUIRED'?'Unauthorized':'CONTROL_SURFACE_ERROR'},{status:e instanceof Error&&e.message==='ADMIN_AUTH_REQUIRED'?401:400})}}
