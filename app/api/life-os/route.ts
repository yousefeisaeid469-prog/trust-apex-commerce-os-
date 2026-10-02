import { NextResponse } from 'next/server';
import { buildLifePlan, buildLifeSnapshot, type Mission } from '@/modules/experience/life-os/engine';
export async function GET(){ return NextResponse.json(buildLifeSnapshot()); }
export async function POST(req: Request){ const body=await req.json().catch(()=>({})); const missions: Mission[]=['REPLENISH','WARRANTY_CHECK','FAMILY_BUY','DEADLINE_BUY','PREFERENCE_MATCH']; if(!missions.includes(body.mission)) return NextResponse.json({error:'Invalid mission'},{status:400}); return NextResponse.json({plan:buildLifePlan(body)}); }
