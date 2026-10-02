import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/modules/platform/auth/current-user';
import { runShipmentReconciliationWorker } from '@/modules/platform/fulfillment-providers/execution';
const privileged=['admin','support','operations'];
export const dynamic='force-dynamic';export const runtime='nodejs';
export async function POST(req:NextRequest){const u=await getCurrentUser(req);if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED',surfaceStatus:'ERROR'},{status:401});if(!privileged.includes(u.role))return NextResponse.json({ok:false,error:'PRIVILEGED_ACCESS_REQUIRED',surfaceStatus:'ERROR'},{status:403});try{const body=await req.json().catch(()=>({}));const limit=Number(body.limit??50);const results=await runShipmentReconciliationWorker(limit);return NextResponse.json({ok:true,surfaceStatus:'LIVE',processed:results.length,results},{headers:{'Cache-Control':'no-store'}})}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'RECONCILIATION_ERROR',surfaceStatus:'ERROR'},{status:400})}}
