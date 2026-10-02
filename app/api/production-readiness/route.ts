import { NextResponse } from 'next/server';
import { buildProductionReadinessReport } from '../../../modules/platform/production-readiness';
export const dynamic='force-dynamic';
export async function GET(){ return NextResponse.json({ok:true,report:buildProductionReadinessReport()},{headers:{'Cache-Control':'no-store'}}); }
export async function POST(req:Request){ try { const body=await req.json(); return NextResponse.json({ok:true,report:buildProductionReadinessReport(body||{})},{headers:{'Cache-Control':'no-store'}}); } catch(e:any) { return NextResponse.json({ok:false,error:e?.message??'PRODUCTION_READINESS_ERROR'},{status:400}); } }
