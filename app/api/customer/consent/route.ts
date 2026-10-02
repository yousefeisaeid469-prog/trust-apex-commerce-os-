import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requirePermission } from '../../../../modules/platform/auth/current-user';
export const dynamic='force-dynamic';
export function ok(data:Record<string,unknown>,status=200){return NextResponse.json({ok:true,surfaceStatus:'LIVE',...data},{status,headers:{'Cache-Control':'no-store'}})}
export function fail(e:unknown,status=400){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'REQUEST_FAILED',surfaceStatus:'ERROR'},{status,headers:{'Cache-Control':'no-store'}})}
import { resolveConsent,resolveBulkConsent } from '../../../../modules/customer-experience/consent';
export async function GET(request:NextRequest){try{const u=await getCurrentUser(request);if(!u)return fail(new Error('AUTH_REQUIRED'),401);const scope=String(request.nextUrl.searchParams.get('scope')??'MARKETING') as any;const channel=String(request.nextUrl.searchParams.get('channel')??'EMAIL') as any;return ok({decision:await resolveConsent(u.id,scope,channel)})}catch(e){return fail(e)}}
export async function POST(request:NextRequest){try{const u=await getCurrentUser(request);if(!u)return fail(new Error('AUTH_REQUIRED'),401);const b=await request.json();return ok({decisions:await resolveBulkConsent(u.id,b.requests??[])})}catch(e){return fail(e)}}
