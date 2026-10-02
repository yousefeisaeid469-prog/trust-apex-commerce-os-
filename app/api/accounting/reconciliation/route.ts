import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { accountingReconciliation } from '../../../../modules/platform/accounting-core';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){const u=await getCurrentUser(req);if(!u||!['admin','operations'].includes(u.role))return NextResponse.json({ok:false,error:u?'FORBIDDEN':'AUTH_REQUIRED'},{status:u?403:401});return NextResponse.json({ok:true,reconciliation:await accountingReconciliation()})}
