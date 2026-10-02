import { NextResponse } from 'next/server';
import { getGlobalCommerceControlPlaneOverview, listGlobalCommerceIncidents } from '../../../../modules/platform/global-commerce-control-plane/core';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(request:Request){
  try{
    const url=new URL(request.url); const view=url.searchParams.get('view')||'overview';
    if(view==='incidents') return NextResponse.json({ok:true,version:'V375.0.0',incidents:await listGlobalCommerceIncidents(Number(url.searchParams.get('limit')||50))},{headers:{'cache-control':'no-store'}});
    return NextResponse.json({ok:true,...await getGlobalCommerceControlPlaneOverview()},{headers:{'cache-control':'no-store'}});
  }catch(error){return NextResponse.json({ok:false,error:'GLOBAL_CONTROL_PLANE_UNAVAILABLE',message:error instanceof Error?error.message:'UNKNOWN_ERROR'},{status:503});}
}
