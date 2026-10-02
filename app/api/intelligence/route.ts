import { buildSnapshot } from '../../../modules/intelligence/engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(buildSnapshot(), { headers: { 'Cache-Control': 'no-store' } });
}
