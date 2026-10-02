import { NextResponse } from 'next/server';
import { getProductHealth } from '../../../../modules/platform/product-core';
export const dynamic='force-dynamic';
export async function GET(){return NextResponse.json({ok:true,health:await getProductHealth(),honestBoundaries:['External payment credentials/providers','Tax jurisdiction certification','Carrier contracts','Production load/DR certification']},{headers:{'Cache-Control':'no-store'}})}
