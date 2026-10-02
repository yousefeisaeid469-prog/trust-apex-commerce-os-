import { NextResponse } from 'next/server';
import { merchantRepository } from '../../../lib/data-core/store';
export async function GET() { const items = await merchantRepository.list(); return NextResponse.json({ items, total: items.length }, { headers: { 'Cache-Control': 'no-store' } }); }
