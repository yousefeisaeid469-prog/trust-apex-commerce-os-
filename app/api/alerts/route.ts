import { NextResponse } from 'next/server';
export async function POST(){
  return NextResponse.json({ok:false,surfaceStatus:'PROVIDER_REQUIRED',productionMutation:false,error:'PRODUCTION_IMPLEMENTATION_REQUIRED',feature:'alerts'}, {status:501,headers:{'Cache-Control':'no-store'}});
}
