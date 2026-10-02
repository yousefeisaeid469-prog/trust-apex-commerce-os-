import { TRUST_VERSION_NUMBER } from '../../../lib/runtime/version';
import { NextResponse } from 'next/server';
import { protectPurchase, buildProtectionSnapshot } from '../../../modules/experience/protection/engine';
export async function GET(){return NextResponse.json({snapshot:buildProtectionSnapshot(),version:TRUST_VERSION_NUMBER});}
export async function POST(req:Request){try{const body=await req.json();return NextResponse.json({decision:protectPurchase(body)});}catch{return NextResponse.json({error:'Invalid protection request'},{status:400});}}
