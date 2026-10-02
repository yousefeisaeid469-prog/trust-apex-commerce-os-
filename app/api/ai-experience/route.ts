import { NextResponse } from 'next/server';
import { buildAiExperience } from '../../../modules/ai-experience';
import { runShoppingConcierge } from '../../../modules/experience/concierge/engine';

export const dynamic='force-dynamic';

export async function POST(request:Request){
  const body=await request.json().catch(()=>({}));
  const mission=typeof body?.mission==='string'?body.mission.trim():'';
  const budget=Number.isFinite(Number(body?.budget)) && body?.budget!=='' ? Number(body.budget) : undefined;
  const priorities=Array.isArray(body?.priorities)?body.priorities.filter((x:unknown):x is string=>typeof x==='string'):[];
  const ai=buildAiExperience({mission,budget,priorities});
  const concierge=mission ? runShoppingConcierge({query:mission,budget,currency:'EGP',priorities:priorities as any}) : null;
  return NextResponse.json({ok:true,ai,concierge},{headers:{'Cache-Control':'no-store'}});
}
