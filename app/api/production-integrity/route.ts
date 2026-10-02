import { NextResponse } from 'next/server';
import { requireAdminSession } from '../../../modules/platform/security/route-auth';
import { integrityOverview } from '../../../modules/platform/integrity/overview';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:Request){try{const admin=await requireAdminSession(req);return NextResponse.json({ok:true,admin:admin.email,overview:await integrityOverview()},{headers:{'Cache-Control':'no-store'}});}catch(e){const code=e instanceof Error?e.message:'INTEGRITY_ERROR';return NextResponse.json({ok:false,error:code},{status:code==='ADMIN_AUTH_REQUIRED'?401:code==='DATABASE_NOT_CONFIGURED'?503:500});}}
