import {NextResponse} from 'next/server';
import {buildSecurityScaleReport} from '../../../modules/platform/production-security-scale';
export const dynamic='force-dynamic';
export async function GET(){return NextResponse.json({ok:true,report:buildSecurityScaleReport({controls:[{id:'RATE-LIMIT-BACKEND',status:process.env.TRUST_RATE_LIMIT_BACKEND==='shared'?'PASS':(process.env.NODE_ENV==='production'?'FAIL':'WARN'),detail:process.env.TRUST_RATE_LIMIT_BACKEND==='shared'?'Shared rate-limit backend declared.':'Shared rate-limit backend is not declared.'}]})},{headers:{'Cache-Control':'no-store'}});}
