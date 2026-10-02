import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requirePermission } from './../../../../../../../modules/platform/auth/current-user.ts';
export const dynamic='force-dynamic';
export function ok(data:Record<string,unknown>,status=200){return NextResponse.json({ok:true,surfaceStatus:'LIVE',...data},{status,headers:{'Cache-Control':'no-store'}})}
export function fail(e:unknown,status=400){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'REQUEST_FAILED',surfaceStatus:'ERROR'},{status,headers:{'Cache-Control':'no-store'}})}
import { rebuildSegment } from '../../../../../../../modules/customer-experience/ops';
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{await requirePermission(request,'manage_system');const b=await request.json().catch(()=>({}));return ok({result:await rebuildSegment((await params).id,Number(b.limit??1000))})}catch(e){return fail(e,403)}}
