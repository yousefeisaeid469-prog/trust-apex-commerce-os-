import {NextResponse} from 'next/server';import {listPromotions} from '../../../modules/commerce/promotions/store';
export const dynamic='force-dynamic';export async function GET(){return NextResponse.json({ok:true,promotions:listPromotions()},{headers:{'Cache-Control':'no-store'}})}
