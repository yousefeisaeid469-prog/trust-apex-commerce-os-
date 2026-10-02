import { NextResponse } from 'next/server';
import { TRUST_VERSION_NUMBER } from '../../../lib/runtime/version';
import { searchProducts } from '../../../modules/commerce/repository/catalog';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const products = await searchProducts();
  return NextResponse.json({ ok: true, version: TRUST_VERSION_NUMBER, count: products.length, products });
}
