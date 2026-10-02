import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { getProductHealth } from '../../../../modules/platform/product-core';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){const u=await getCurrentUser(req);if(!u||u.role!=='admin')return NextResponse.json({ok:false,error:'ADMIN_REQUIRED'},{status:u?403:401});return NextResponse.json({ok:true,dashboard:await getProductHealth()})}
