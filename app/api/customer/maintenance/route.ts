import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from './../../../../modules/platform/auth/current-user.ts';
export const dynamic='force-dynamic';
export async function customer(request:NextRequest){const user=await getCurrentUser(request);if(!user)return {error:NextResponse.json({ok:false,error:'AUTH_REQUIRED',surfaceStatus:'ERROR'},{status:401})};return {user};}
export function ok(data:Record<string,unknown>,status=200){return NextResponse.json({ok:true,surfaceStatus:'LIVE',...data},{status,headers:{'Cache-Control':'no-store'}});}
export function fail(error:unknown,status=400){const code=error instanceof Error?error.message:'REQUEST_FAILED';return NextResponse.json({ok:false,error:code,surfaceStatus:'ERROR'},{status,headers:{'Cache-Control':'no-store'}});}

import {requirePermission} from '../../../../modules/platform/auth/current-user';
import {runPrivacyWorker,customerMaintenanceHealth,recoverStalePrivacyJobs} from '../../../../modules/customer-experience/worker';
export async function GET(request:NextRequest){try{await requirePermission(request,'manage_system');return ok({health:await customerMaintenanceHealth()});}catch(e){return fail(e,403);}}
export async function POST(request:NextRequest){try{await requirePermission(request,'manage_system');const body=await request.json().catch(()=>({}));if(body.action==='recover')return ok({recovered:await recoverStalePrivacyJobs(Number(body.maxAgeMinutes??30))});return ok({result:await runPrivacyWorker(Number(body.limit??10))});}catch(e){return fail(e,403);}}
