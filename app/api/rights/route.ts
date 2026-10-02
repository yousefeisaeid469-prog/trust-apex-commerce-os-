import { NextResponse } from 'next/server';
import { evaluateRights } from '@/modules/experience/rights/engine';
export async function POST(req: Request) { const body = await req.json(); return NextResponse.json({ ok: true, report: evaluateRights(body) }); }
