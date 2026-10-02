import { NextResponse } from 'next/server';
import { buildPersonalShopper, ShopperMission } from '../../../modules/experience/personal-shopper/engine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body.query !== 'string' || body.query.trim().length < 2) return NextResponse.json({ error: 'query is required' }, { status: 400 });
    const mission: ShopperMission = {
      query: body.query.trim().slice(0, 500),
      budget: Number.isFinite(Number(body.budget)) && Number(body.budget) > 0 ? Number(body.budget) : undefined,
      deadline: ['today','tomorrow','flexible'].includes(body.deadline) ? body.deadline : 'flexible',
      priorities: Array.isArray(body.priorities) ? body.priorities.filter((x: unknown) => ['price','quality','delivery','trust','returns'].includes(String(x))) : [],
    };
    return NextResponse.json({ ok:true, surfaceStatus:'LIVE', ...(await buildPersonalShopper(mission)) });
  } catch (e) { const code=e instanceof Error?e.message:'INVALID_REQUEST'; const status=code==='DATABASE_NOT_CONFIGURED'?503:400; return NextResponse.json({ ok:false, surfaceStatus:'ERROR', error:code }, { status }); }
}
