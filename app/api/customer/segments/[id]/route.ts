import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requirePermission } from './../../../../../modules/platform/auth/current-user.ts';
export const dynamic='force-dynamic';
export function ok(data:Record<string,unknown>,status=200){return NextResponse.json({ok:true,surfaceStatus:'LIVE',...data},{status,headers:{'Cache-Control':'no-store'}})}
export function fail(e:unknown,status=400){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'REQUEST_FAILED',surfaceStatus:'ERROR'},{status,headers:{'Cache-Control':'no-store'}})}
import { getSegment,updateSegment,deleteSegment } from '../../../../../modules/customer-experience/segments';
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{await requirePermission(request,'manage_system');return ok({segment:await getSegment((await params).id)})}catch(e){return fail(e,403)}}
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{await requirePermission(request,'manage_system');return ok({segment:await updateSegment((await params).id,await request.json())})}catch(e){return fail(e,403)}}
export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{await requirePermission(request,'manage_system');return ok(await deleteSegment((await params).id))}catch(e){return fail(e,403)}}
