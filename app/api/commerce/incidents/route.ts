import { NextResponse } from 'next/server';
import { discoverCommerceIncidents, persistIncidentSnapshot } from '../../../../modules/platform/global-commerce-incident-orchestrator/core';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(request:Request){try{const url=new URL(request.url);const incidents=await discoverCommerceIncidents(Number(url.searchParams.get('limit')||50));const snapshotKey=await persistIncidentSnapshot(incidents);return NextResponse.json({ok:true,version:'V376.0.0',snapshotKey,incidents},{headers:{'cache-control':'no-store'}});}catch(error){return NextResponse.json({ok:false,error:'COMMERCE_INCIDENTS_UNAVAILABLE',message:error instanceof Error?error.message:'UNKNOWN_ERROR'},{status:503});}}
