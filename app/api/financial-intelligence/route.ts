import { NextResponse } from 'next/server';
import { calculateTotalCost, affordabilitySignal } from '@/modules/experience/financial-intelligence/engine';
import { getCurrentUser } from '@/modules/platform/auth/current-user';
export async function POST(req: Request) { const user=await getCurrentUser(req); if(!user) return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401}); const body = await req.json(); const total = calculateTotalCost(body); return NextResponse.json({ ok: true, total, affordability: affordabilitySignal(total.expectedLifecycleCost, body.budget) }); }
