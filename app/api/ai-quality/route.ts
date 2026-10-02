import { NextResponse } from 'next/server';
import { requireUser } from '../../../modules/platform/auth/current-user';
import { evaluateAiQuality } from '../../../modules/platform/v319';
import { query } from '../../../modules/platform/db/postgres';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{const user=await requireUser(req as any);const r=await query(`select id,subject_id,model,score,status,checks_json,created_at from trust_ai_quality_evaluations where actor_id=$1 order by created_at desc limit 50`,[user.id]);return NextResponse.json({ok:true,surfaceStatus:'LIVE',evaluations:r.rows});}catch(e){const code=e instanceof Error?e.message:'AI_QUALITY_QUERY_FAILED';return NextResponse.json({ok:false,error:code},{status:code==='DATABASE_NOT_CONFIGURED'?503:401});}}
export async function POST(req:Request){try{const user=await requireUser(req as any);const b=await req.json();const evaluation=await evaluateAiQuality({actorId:user.id,subjectId:String(b.subjectId||'unknown'),inputText:String(b.inputText||''),expected:b.expected,actual:String(b.actual||''),model:b.model});return NextResponse.json({ok:true,surfaceStatus:'LIVE',evaluation},{status:201});}catch(e){const code=e instanceof Error?e.message:'AI_QUALITY_EVALUATION_FAILED';return NextResponse.json({ok:false,error:code},{status:code==='DATABASE_NOT_CONFIGURED'?503:400});}}
