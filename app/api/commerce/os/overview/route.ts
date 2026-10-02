import { NextResponse } from 'next/server';
import { getUnifiedCommerceOverview } from '../../../../../modules/platform/unified-commerce-os/core';
export const dynamic='force-dynamic'; export const revalidate=0;
export async function GET(){try{return NextResponse.json(await getUnifiedCommerceOverview(),{headers:{'cache-control':'no-store'}});}catch(error){return NextResponse.json({error:'COMMERCE_OS_UNAVAILABLE',message:error instanceof Error?error.message:'UNKNOWN_ERROR'},{status:503});}}
