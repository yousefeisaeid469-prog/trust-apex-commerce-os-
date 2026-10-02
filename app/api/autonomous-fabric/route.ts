import {NextRequest,NextResponse} from 'next/server';
import {buildOverview} from '../../../modules/platform/autonomous-commerce-fabric/core';
import type {FabricSnapshot} from '../../../modules/platform/autonomous-commerce-fabric/contracts';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){try{const body=await req.json() as FabricSnapshot; if(!body||!Array.isArray(body.agents)||!Array.isArray(body.products))return NextResponse.json({ok:false,error:'INVALID_SNAPSHOT'},{status:400}); return NextResponse.json({ok:true,overview:buildOverview(body)},{headers:{'Cache-Control':'no-store'}});}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'FABRIC_FAILED'},{status:400});}}
