import { NextResponse } from 'next/server';
import { productionReadiness } from '@/modules/platform/persistence/production-readiness';
import { env } from '@/modules/platform/config/env';
import { version } from '@/lib/runtime/version';

export async function GET() {
  const readiness = productionReadiness(process.env);
  const production = env.nodeEnv === 'production';
  return NextResponse.json({
    version,
    environment: env.nodeEnv,
    production,
    launchReadyByConfig: production && readiness.ready,
    dependencies: readiness.dependencies.map((d: {name:string; configured:boolean; requiredForLaunch:boolean})=>({name:d.name,configured:d.configured,requiredForLaunch:d.requiredForLaunch})),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
