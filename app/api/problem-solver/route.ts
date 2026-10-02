import { NextRequest, NextResponse } from 'next/server';
import { buildProblemSnapshot, resolveProblem, type ProblemInput } from '@/modules/experience/problem-solver/engine';

export async function GET() { return NextResponse.json({ ok:true, snapshot:buildProblemSnapshot() }); }
export async function POST(request:NextRequest) {
  try {
    const body = await request.json() as ProblemInput;
    if (!body?.type) return NextResponse.json({ ok:false,error:'problem type required' },{status:400});
    return NextResponse.json({ ok:true, resolution:resolveProblem(body) });
  } catch { return NextResponse.json({ ok:false,error:'invalid request' },{status:400}); }
}
