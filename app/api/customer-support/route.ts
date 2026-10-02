import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../modules/platform/auth/current-user';
import { createSupportCase, listSupportCases } from '../../../modules/customer-support/service';
import { AuthRequiredError } from '../../../modules/platform/auth/current-user';

export async function GET(req:Request){
  try { const user=await getCurrentUser(req as any); if(!user) throw new AuthRequiredError(); return NextResponse.json({ok:true,feature:'customer-support',surfaceStatus:'LIVE',cases:await listSupportCases(user.id)},{headers:{'Cache-Control':'no-store'}}); }
  catch(e){return NextResponse.json({ok:false,error:e instanceof AuthRequiredError?'AUTH_REQUIRED':e instanceof Error?e.message:'SUPPORT_ERROR'},{status:e instanceof AuthRequiredError?401:e instanceof Error&&e.message==='DATABASE_NOT_CONFIGURED'?503:400});}
}
export async function POST(req:Request){
  try { const user=await getCurrentUser(req as any); if(!user) throw new AuthRequiredError(); const b=await req.json().catch(()=>({})); const item=await createSupportCase({customerId:user.id,orderId:typeof b.orderId==='string'?b.orderId:undefined,problemType:String(b.problemType??'OTHER'),severity:typeof b.severity==='string'?b.severity:undefined,description:typeof b.description==='string'?b.description:undefined}); return NextResponse.json({ok:true,feature:'customer-support',surfaceStatus:'LIVE',case:item},{status:201,headers:{'Cache-Control':'no-store'}}); }
  catch(e){return NextResponse.json({ok:false,error:e instanceof AuthRequiredError?'AUTH_REQUIRED':e instanceof Error?e.message:'SUPPORT_ERROR'},{status:e instanceof AuthRequiredError?401:e instanceof Error&&e.message==='DATABASE_NOT_CONFIGURED'?503:400});}
}
