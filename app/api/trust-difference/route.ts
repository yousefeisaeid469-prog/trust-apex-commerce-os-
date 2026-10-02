import { NextResponse } from 'next/server';
import { getSwitchingExperience } from '../../../modules/experience/switching/engine';

export async function GET() {
  return NextResponse.json({ ok: true, data: getSwitchingExperience() }, { headers: { 'Cache-Control': 'private, max-age=30' } });
}
