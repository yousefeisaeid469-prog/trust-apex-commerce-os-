import {NextResponse} from 'next/server';
import {buildSuperAppPlan} from '../../../modules/platform/super-app-experience';
export const dynamic='force-dynamic';
export async function GET(req:Request){const u=new URL(req.url);return NextResponse.json(buildSuperAppPlan({orders:Number(u.searchParams.get('orders')),repeatRate:Number(u.searchParams.get('repeatRate')),problems:Number(u.searchParams.get('problems')),catalogSize:Number(u.searchParams.get('catalogSize')),isSeller:u.searchParams.get('seller')==='1'}),{headers:{'Cache-Control':'no-store'}})}
export async function POST(req:Request){const b=await req.json().catch(()=>({}));return NextResponse.json(buildSuperAppPlan({orders:Number(b?.orders),repeatRate:Number(b?.repeatRate),problems:Number(b?.problems),catalogSize:Number(b?.catalogSize),isSeller:b?.isSeller===true}),{headers:{'Cache-Control':'no-store'}})}
