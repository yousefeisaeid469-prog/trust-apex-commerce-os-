import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '../../../modules/platform/admin/access';
export async function GET(){ const token=cookies().get('trust_admin_session')?.value; if(!token || !verifyAdminSession(token)) return NextResponse.json({error:'Unauthorized'},{status:401}); return NextResponse.json({status:'ok',metrics:{missionStarts:null,recommendationCtr:null,compareRate:null,visionMatches:null},note:'Connect durable analytics provider before exposing production metrics.'}); }
