import { NextRequest, NextResponse } from 'next/server';
import { buildPreventionSnapshot, preventProblem, type PreventionInput } from '@/modules/experience/prevention/engine';

export async function GET() {
  return NextResponse.json({ ok: true, snapshot: buildPreventionSnapshot() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as PreventionInput;
    if (!body?.signal) return NextResponse.json({ ok: false, error: 'signal required' }, { status: 400 });
    return NextResponse.json({ ok: true, decision: preventProblem(body) });
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid request' }, { status: 400 });
  }
}
