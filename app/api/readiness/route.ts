import { NextResponse } from 'next/server';
import { productionReadiness } from '../../../modules/platform/persistence/production-readiness';
import { TRUST_VERSION_NUMBER } from '../../../lib/runtime/version';
export const dynamic='force-dynamic';
export async function GET(){
  const r=await productionReadiness();
  return NextResponse.json({ok:r.ready,...r,version:TRUST_VERSION_NUMBER},{status:r.ready?200:503,headers:{'Cache-Control':'no-store'}});
}
