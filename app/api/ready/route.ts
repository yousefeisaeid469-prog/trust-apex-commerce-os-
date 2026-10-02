import { NextResponse } from 'next/server';
import { databaseConfigured, query } from '../../../modules/platform/db/postgres';
import { productionConfigCheck } from '../../../modules/platform/config/env';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(){
  const config=productionConfigCheck();
  if(!databaseConfigured() || !config.ok) return NextResponse.json({ok:false,status:'not_ready',checks:{config:config.ok,database:false},missing:config.missing,invalid:config.invalid},{status:503,headers:{'cache-control':'no-store'}});
  const started=Date.now();
  try { await query('select 1'); return NextResponse.json({ok:true,status:'ready',checks:{config:true,database:true},latencyMs:Date.now()-started},{headers:{'cache-control':'no-store'}}); }
  catch { return NextResponse.json({ok:false,status:'not_ready',checks:{config:true,database:false}},{status:503,headers:{'cache-control':'no-store'}}); }
}
