import { NextResponse } from 'next/server';
import { ALL_CURRENCY_CODES, CURRENCY_META } from '../../../lib/i18n/currency';
import { GLOBAL_LANGUAGES } from '../../../lib/i18n/global';

export async function GET() {
  return NextResponse.json({ ok:true, version:1, languages:GLOBAL_LANGUAGES, currencies:ALL_CURRENCY_CODES.map(code=>CURRENCY_META[code]) }, { headers:{'Cache-Control':'public, max-age=86400, stale-while-revalidate=604800'} });
}
