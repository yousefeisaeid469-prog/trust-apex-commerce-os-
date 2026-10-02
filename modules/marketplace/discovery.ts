import { createHash } from 'node:crypto';
import { query } from '../platform/db/postgres';
import type { Product } from '../commerce/core/types';
import { getProductMarketplaceContext } from './offers';
import { getPreferenceProfile, personalizedScore } from './personalization';

export type MarketplaceSort = 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
export type MarketplaceSearchInput = {
  q?: string; category?: string; merchant?: string; region?: string;
  minPrice?: number; maxPrice?: number; minRating?: number; tag?: string;
  inStock?: boolean; sort?: MarketplaceSort; page?: number; limit?: number;
};

const columns = `p.id,p.merchant_id,p.name,p.category,p.price,p.old_price,p.stock,p.region,p.tags,p.image,p.rating,p.created_at,m.store_name`;
const from = `from trust_products p join trust_merchant_profiles m on m.id=p.merchant_id`;

export { normalizeSearch, rankSearchScore } from './discovery-ranking.ts';
import { normalizeSearch, rankSearchScore } from './discovery-ranking.ts';

function mapProduct(r: any): Product & { searchScore: number } {
  return {
    id: String(r.id), name: String(r.name), category: String(r.category), price: Number(r.price),
    oldPrice: r.old_price === null ? undefined : Number(r.old_price), merchantId: String(r.merchant_id),
    merchantName: String(r.store_name ?? ''), rating: Number(r.rating), stock: Number(r.stock), region: String(r.region),
    tags: Array.isArray(r.tags) ? r.tags.map(String) : [], image: String(r.image ?? ''),
    searchScore: rankSearchScore({ textRank: Number(r.text_rank ?? 0), rating: Number(r.rating), stock: Number(r.stock), price: Number(r.price), oldPrice: r.old_price }),
  };
}

export async function searchMarketplace(input: MarketplaceSearchInput & { sessionKey?: string } = {}) {
  const q = normalizeSearch(String(input.q ?? ''));
  const category = String(input.category ?? '').trim();
  const merchant = String(input.merchant ?? '').trim();
  const region = String(input.region ?? '').trim();
  const minPrice = input.minPrice !== undefined && Number.isFinite(input.minPrice) ? Math.max(0, input.minPrice) : undefined;
  const maxPrice = input.maxPrice !== undefined && Number.isFinite(input.maxPrice) ? Math.max(0, input.maxPrice) : undefined;
  const minRating = input.minRating !== undefined && Number.isFinite(input.minRating) ? Math.max(0, Math.min(5, input.minRating)) : undefined;
  const tag = String(input.tag ?? '').trim().toLowerCase().slice(0, 80);
  const inStock = input.inStock === true;
  const page = Math.max(1, Number.isInteger(input.page) ? input.page! : 1);
  const limit = Math.min(48, Math.max(1, Number.isInteger(input.limit) ? input.limit! : 24));
  const offset = (page - 1) * limit;
  const params: unknown[] = [];
  const where = ['p.active=true'];
  if (q) { params.push(q); const n=params.length; where.push(`(p.search_vector @@ websearch_to_tsquery('simple',$${n}) or lower(m.store_name) like lower('%' || $${n} || '%'))`); }
  if (category) { params.push(category); where.push(`lower(p.category)=lower($${params.length})`); }
  if (merchant) { params.push(merchant); where.push(`lower(m.store_name)=lower($${params.length})`); }
  if (region) { params.push(region); where.push(`lower(p.region)=lower($${params.length})`); }
  if (minPrice !== undefined) { params.push(minPrice); where.push(`p.price >= $${params.length}`); }
  if (maxPrice !== undefined) { params.push(maxPrice); where.push(`p.price <= $${params.length}`); }
  if (minRating !== undefined) { params.push(minRating); where.push(`p.rating >= $${params.length}`); }
  if (tag) { params.push(tag); where.push(`$${params.length}=any(lower_tags.tags)`); }
  if (inStock) where.push('p.stock > 0');
  const predicate = where.join(' and ');
  const rankExpr = q ? `(ts_rank_cd(p.search_vector, websearch_to_tsquery('simple',$1)) + case when lower(m.store_name) like lower('%' || $1 || '%') then 0.15 else 0 end)` : '0';
  const searchFrom = `${from} cross join lateral (select coalesce(array_agg(lower(t)), '{}') tags from unnest(coalesce(p.tags,'{}')) t) lower_tags`;
  const count = await query(`select count(*)::int total ${searchFrom} where ${predicate}`, params);
  const total = Number(count.rows[0]?.total ?? 0);
  const sort = input.sort ?? 'relevance';
  const order = sort === 'price_asc' ? 'p.price asc,p.rating desc,p.id asc' : sort === 'price_desc' ? 'p.price desc,p.rating desc,p.id asc' : sort === 'rating' ? 'p.rating desc,p.stock desc,p.created_at desc' : sort === 'newest' ? 'p.created_at desc,p.id desc' : 'text_rank desc,p.rating desc,(p.stock>0) desc,p.created_at desc,p.id desc';
  const dataParams = [...params, limit, offset];
  const rows = await query(`select ${columns},${rankExpr} text_rank ${searchFrom} where ${predicate} order by ${order} limit $${dataParams.length-1} offset $${dataParams.length}`, dataParams);
  const profile = await getPreferenceProfile(input.sessionKey);
  const items = rows.rows.map(mapProduct).map(item => ({ ...item, personalizedScore: personalizedScore({base:item.searchScore,category:item.category,price:item.price,profile}) })).sort((a,b) => sort === 'relevance' ? b.personalizedScore-a.personalizedScore || b.searchScore-a.searchScore || b.rating-a.rating || b.id.localeCompare(a.id) : 0);
  const facets = await query(`select p.category,count(*)::int count ${searchFrom} where ${predicate} group by p.category order by count desc,p.category asc limit 40`, params);
  const eventHash = q ? createHash('sha256').update(q).digest('hex') : null;
  await query(`insert into trust_marketplace_search_events(query_hash,category,region,sort,result_count) values($1,$2,$3,$4,$5)`, [eventHash, category || null, region || null, sort, total]).catch(() => undefined);
  return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)), filters: { q: q || undefined, category: category || undefined, merchant: merchant || undefined, region: region || undefined, minPrice, maxPrice, minRating, tag: tag || undefined, inStock }, facets: facets.rows.map(r => ({ category: String(r.category), count: Number(r.count) })), query: q, sort, personalization: { mode: profile.viewedProducts > 0 ? 'PERSONALIZED_ORGANIC' : 'COLD_START', viewedProducts: profile.viewedProducts, sponsoredExcluded: true } };
}

export async function getMarketplaceProduct(id: string) {
  const result = await query(`select ${columns} from trust_products p join trust_merchant_profiles m on m.id=p.merchant_id where p.id=$1 and p.active=true limit 1`, [id]);
  if (!result.rows[0]) return undefined;
  const product = mapProduct({ ...result.rows[0], text_rank: 1 });
  const related = await query(`select ${columns} from trust_products p join trust_merchant_profiles m on m.id=p.merchant_id where p.active=true and p.category=$1 and p.id<>$2 order by p.rating desc,p.stock desc,p.created_at desc limit 8`, [result.rows[0].category, id]);
  const marketplace = await getProductMarketplaceContext(id);
  return { product, related: related.rows.map(r => mapProduct({ ...r, text_rank: 0 })), marketplace };
}
