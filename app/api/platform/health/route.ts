import { NextResponse } from 'next/server';
import { query, databaseConfigured } from '../../../../modules/platform/db/postgres';
import { createRequestContext } from '../../../../modules/platform/runtime/request-context';

export const dynamic='force-dynamic';
export async function GET(request:Request){
 const ctx=createRequestContext({ip:request.headers.get('x-forwarded-for')??undefined,userAgent:request.headers.get('user-agent')??undefined});
 const started=Date.now();
 if(!databaseConfigured()) return NextResponse.json({surfaceStatus:'DEGRADED',database:'NOT_CONFIGURED',requestId:ctx.requestId,traceId:ctx.traceId},{status:503,headers:{'cache-control':'no-store','x-request-id':ctx.requestId}});
 try { await query('select 1 as ok'); return NextResponse.json({surfaceStatus:'LIVE',database:'OK',latencyMs:Date.now()-started,requestId:ctx.requestId,traceId:ctx.traceId},{headers:{'cache-control':'no-store','x-request-id':ctx.requestId,'x-trace-id':ctx.traceId}}); }
 catch(e){ return NextResponse.json({surfaceStatus:'ERROR',database:'UNAVAILABLE',error:e instanceof Error?e.message:'DATABASE_ERROR',requestId:ctx.requestId,traceId:ctx.traceId},{status:503,headers:{'cache-control':'no-store','x-request-id':ctx.requestId,'x-trace-id':ctx.traceId}}); }
}
