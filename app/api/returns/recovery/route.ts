import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { query, withPgTransaction } from '../../../../modules/platform/db/postgres';
import { applyInventoryRecovery, listRecoveryActions, recommendRecovery, reverseInventoryRecovery } from '../../../../modules/commerce/reverse-commerce';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const privileged = (role: string) => ['admin','operations','support','merchant'].includes(role);
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return json({ ok: false, error: 'AUTH_REQUIRED', surfaceStatus: 'ERROR' }, 401);
  try {
    const returnId = req.nextUrl.searchParams.get('returnId') || undefined;
    const productId = req.nextUrl.searchParams.get('productId') || undefined;
    const status = req.nextUrl.searchParams.get('status') || undefined;
    if ((returnId || productId || status) && !privileged(user.role)) return json({ ok:false,error:'FORBIDDEN',surfaceStatus:'ERROR' },403);
    const actions = await listRecoveryActions({ query, transaction: withPgTransaction }, { returnId: returnId || undefined, productId: productId || undefined, status, limit: Number(req.nextUrl.searchParams.get('limit') || 100) });
    return json({ ok:true, actions, surfaceStatus:'LIVE' });
  } catch (error) { return json({ ok:false,error:error instanceof Error ? error.message : 'RECOVERY_LIST_FAILED',surfaceStatus:'ERROR' },500); }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return json({ ok:false,error:'AUTH_REQUIRED',surfaceStatus:'ERROR' },401);
  if (!privileged(user.role)) return json({ ok:false,error:'FORBIDDEN',surfaceStatus:'ERROR' },403);
  const key = req.headers.get('idempotency-key')?.trim();
  if (!key) return json({ ok:false,error:'IDEMPOTENCY_KEY_REQUIRED',surfaceStatus:'ERROR' },400);
  try {
    const body = await req.json();
    const result = await applyInventoryRecovery({ query, transaction: withPgTransaction }, { ...body, actorId:user.id, idempotencyKey:key });
    return json({ ok:true,result,surfaceStatus:'LIVE' },201);
  } catch (error) {
    const code = error instanceof Error ? error.message : 'RECOVERY_FAILED';
    return json({ ok:false,error:code,surfaceStatus:'ERROR' }, code.includes('NOT_FOUND') ? 404 : code.includes('FORBIDDEN') ? 403 : code.startsWith('INVALID_') ? 400 : 409);
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return json({ok:false,error:'AUTH_REQUIRED',surfaceStatus:'ERROR'},401);
  if (!privileged(user.role)) return json({ok:false,error:'FORBIDDEN',surfaceStatus:'ERROR'},403);
  const key = req.headers.get('idempotency-key')?.trim();
  if (!key) return json({ok:false,error:'IDEMPOTENCY_KEY_REQUIRED',surfaceStatus:'ERROR'},400);
  try {
    const body = await req.json();
    if (body.action === 'recommend') {
      const result = await recommendRecovery({query,transaction:withPgTransaction},{returnId:String(body.returnId||''),returnItemId:String(body.returnItemId||''),recoverable:Boolean(body.recoverable),restockable:Boolean(body.restockable),condition:body.condition,reason:body.reason});
      return json({ok:true,result,surfaceStatus:'LIVE'});
    }
    if (body.action === 'reverse') {
      const result = await reverseInventoryRecovery({query,transaction:withPgTransaction},{actionId:String(body.actionId||''),actorId:user.id,idempotencyKey:key});
      return json({ok:true,result,surfaceStatus:'LIVE'});
    }
    return json({ok:false,error:'UNKNOWN_RECOVERY_ACTION',surfaceStatus:'ERROR'},400);
  } catch (error) { return json({ok:false,error:error instanceof Error?error.message:'RECOVERY_ACTION_FAILED',surfaceStatus:'ERROR'},409); }
}
