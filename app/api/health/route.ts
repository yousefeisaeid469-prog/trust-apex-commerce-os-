import { NextResponse } from 'next/server';
import { TRUST_VERSION_NUMBER } from '../../../lib/runtime/version';
export const dynamic='force-dynamic';
export async function GET(){
  return NextResponse.json({ok:true,status:'healthy',version:TRUST_VERSION_NUMBER,service:'trust-apex-os',time:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}});
}
