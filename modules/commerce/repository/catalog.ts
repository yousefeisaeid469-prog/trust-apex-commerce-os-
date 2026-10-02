import { query, withPgTransaction } from '../../platform/db/postgres';
import type { Product } from '../core/types';
import { adjustInventoryTransactionTx } from '../inventory/transaction-engine';

function mapRow(r: any): Product {
  return {
    id: String(r.id), name: String(r.name), category: String(r.category),
    price: Number(r.price), oldPrice: r.old_price !== null ? Number(r.old_price) : undefined,
    merchantId: String(r.merchant_id), merchantName: String(r.store_name ?? r.merchant_name ?? ''),
    rating: Number(r.rating), stock: Number(r.stock), region: String(r.region),
    tags: Array.isArray(r.tags) ? r.tags : [], image: String(r.image ?? ''),
  };
}

const PRODUCT_COLUMNS = `p.id,p.merchant_id,p.name,p.category,p.price,p.old_price,p.stock,p.region,p.tags,p.image,p.rating`;
const PRODUCT_JOIN = `select ${PRODUCT_COLUMNS}, m.store_name from trust_products p join trust_merchant_profiles m on m.id = p.merchant_id`;

export async function getProduct(id: string): Promise<Product | undefined> {
  const result = await query(`${PRODUCT_JOIN} where p.id=$1 and p.active=true limit 1`, [id]);
  return result.rows[0] ? mapRow(result.rows[0]) : undefined;
}

export async function searchProducts(q?: string): Promise<Product[]> {
  const needle = (q ?? '').trim();
  const result = needle
    ? await query(`${PRODUCT_JOIN} where p.active=true and (p.name ilike $1 or p.category ilike $1 or m.store_name ilike $1) order by p.created_at desc limit 200`, [`%${needle}%`])
    : await query(`${PRODUCT_JOIN} where p.active=true order by p.created_at desc limit 200`, []);
  return result.rows.map(mapRow);
}

export type CatalogSort = 'relevance' | 'newest' | 'price_asc' | 'price_desc' | 'rating';
export type CatalogQuery = {
  q?: string;
  category?: string;
  merchant?: string;
  tag?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: CatalogSort;
  page?: number;
  limit?: number;
};

function finiteOrUndefined(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function queryCatalog(input: CatalogQuery = {}) {
  const needle = (input.q ?? '').trim().slice(0, 160);
  const category = (input.category ?? '').trim().slice(0, 80);
  const merchant = (input.merchant ?? '').trim().slice(0, 120);
  const tag = (input.tag ?? '').trim().slice(0, 80).toLowerCase();
  const minPrice = finiteOrUndefined(input.minPrice);
  const maxPrice = finiteOrUndefined(input.maxPrice);
  if (minPrice !== undefined && minPrice < 0) throw new Error('INVALID_MIN_PRICE');
  if (maxPrice !== undefined && maxPrice < 0) throw new Error('INVALID_MAX_PRICE');
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) throw new Error('INVALID_PRICE_RANGE');

  const page = Math.max(1, Number.isInteger(input.page) ? input.page! : 1);
  const limit = Math.min(60, Math.max(1, Number.isInteger(input.limit) ? input.limit! : 24));
  const offset = (page - 1) * limit;
  const sort: CatalogSort = ['relevance','newest','price_asc','price_desc','rating'].includes(String(input.sort))
    ? input.sort as CatalogSort : (needle ? 'relevance' : 'newest');

  const conditions = ['p.active=true'];
  const params: unknown[] = [];
  let rankSql = '0::double precision';
  if (needle) {
    params.push(needle);
    const n = params.length;
    conditions.push(`p.search_vector @@ websearch_to_tsquery('simple', $${n})`);
    rankSql = `ts_rank_cd(p.search_vector, websearch_to_tsquery('simple', $${n}))`;
  }
  if (category) { params.push(category); conditions.push(`lower(p.category)=lower($${params.length})`); }
  if (merchant) { params.push(merchant); conditions.push(`lower(m.store_name)=lower($${params.length})`); }
  if (tag) { params.push(tag); conditions.push(`$${params.length}=any(lower_tags.tags)`); }
  if (minPrice !== undefined) { params.push(minPrice); conditions.push(`p.price >= $${params.length}`); }
  if (maxPrice !== undefined) { params.push(maxPrice); conditions.push(`p.price <= $${params.length}`); }
  if (input.inStock) conditions.push('p.stock > 0');

  const where = conditions.join(' and ');
  const from = `trust_products p join trust_merchant_profiles m on m.id=p.merchant_id
    cross join lateral (select coalesce(array_agg(lower(t)), '{}') tags from unnest(coalesce(p.tags,'{}')) t) lower_tags`;

  const countResult = await query(`select count(*)::int as total from ${from} where ${where}`, params);
  const total = Number(countResult.rows[0]?.total ?? 0);

  const orderBy = sort === 'relevance'
    ? `${rankSql} desc, p.rating desc, p.created_at desc, p.id asc`
    : sort === 'price_asc'
      ? `p.price asc, p.rating desc, p.created_at desc, p.id asc`
      : sort === 'price_desc'
        ? `p.price desc, p.rating desc, p.created_at desc, p.id asc`
        : sort === 'rating'
          ? `p.rating desc, p.created_at desc, p.id asc`
          : `p.created_at desc, p.id asc`;

  const dataParams = [...params, limit, offset];
  const itemsResult = await query(
    `select ${PRODUCT_COLUMNS}, m.store_name, ${rankSql} as search_rank
     from ${from} where ${where}
     order by ${orderBy} limit $${dataParams.length - 1} offset $${dataParams.length}`,
    dataParams
  );

  // Facets are computed only over the filtered result set, not over hidden/inactive products.
  const facetRows = await query<any>(
    `select p.category, count(*)::int as count
     from ${from} where ${where}
     group by p.category order by count(*) desc, p.category asc limit 30`, params
  );

  return {
    items: itemsResult.rows.map(mapRow),
    page, limit, total,
    pages: Math.max(1, Math.ceil(total / limit)),
    sort,
    filters: {
      q: needle || undefined, category: category || undefined, merchant: merchant || undefined,
      tag: tag || undefined, minPrice, maxPrice, inStock: Boolean(input.inStock)
    },
    facets: { categories: facetRows.rows.map((r:any) => ({ category: String(r.category), count: Number(r.count) })) },
  };
}

export async function listMerchantProducts(merchantId: string): Promise<Product[]> {
  const result = await query(`${PRODUCT_JOIN} where p.merchant_id=$1 order by p.created_at desc`, [merchantId]);
  return result.rows.map(mapRow);
}

export type ProductInput = {
  name: string; category: string; price: number; oldPrice?: number;
  stock: number; region: string; tags?: string[]; image?: string;
};

function validateProductInput(input: ProductInput) {
  const name = input.name?.trim();
  const category = input.category?.trim();
  if (!name || name.length < 2 || name.length > 140) throw new Error('INVALID_PRODUCT_NAME');
  if (!category || category.length < 2 || category.length > 60) throw new Error('INVALID_CATEGORY');
  if (!Number.isFinite(input.price) || input.price <= 0 || input.price > 10_000_000) throw new Error('INVALID_PRICE');
  if (input.oldPrice !== undefined && (!Number.isFinite(input.oldPrice) || input.oldPrice <= input.price)) throw new Error('INVALID_OLD_PRICE');
  if (!Number.isInteger(input.stock) || input.stock < 0 || input.stock > 10_000_000) throw new Error('INVALID_STOCK');
  if (!input.region?.trim() || input.region.trim().length > 80) throw new Error('INVALID_REGION');
  return {
    name, category, price: Math.round(input.price * 100) / 100,
    oldPrice: input.oldPrice === undefined ? null : Math.round(input.oldPrice * 100) / 100,
    stock: input.stock, region: input.region.trim(),
    tags: Array.isArray(input.tags) ? input.tags.map(String).map(x => x.trim().toLowerCase()).filter(Boolean).slice(0, 20) : [],
    image: typeof input.image === 'string' && input.image.trim() ? input.image.trim() : '',
  };
}

export async function createMerchantProduct(merchantId: string, _merchantName: string, input: ProductInput): Promise<Product> {
  const clean = validateProductInput(input);
  return withPgTransaction(async client => {
    const result = await client.query(
      `insert into trust_products(merchant_id,name,category,price,old_price,stock,region,tags,image)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id,merchant_id,name,category,price,old_price,stock,region,tags,image,rating`,
      [merchantId, clean.name, clean.category, clean.price, clean.oldPrice, clean.stock, clean.region, clean.tags, clean.image]
    );
    const storeName = await client.query(`select store_name from trust_merchant_profiles where id=$1`, [merchantId]);
    return mapRow({ ...result.rows[0], store_name: storeName.rows[0]?.store_name ?? '' });
  });
}

export async function updateMerchantProduct(merchantId: string, productId: string, input: Partial<ProductInput>): Promise<Product> {
  return withPgTransaction(async client => {
    const existing = await client.query(`select id,merchant_id,name,category,price,old_price,stock,region,tags,image,rating from trust_products where id=$1 and merchant_id=$2 for update`, [productId, merchantId]);
    const current = existing.rows[0];
    if (!current) throw new Error('PRODUCT_NOT_FOUND');
    const merged: ProductInput = {
      name: input.name ?? current.name, category: input.category ?? current.category,
      price: input.price ?? Number(current.price), oldPrice: input.oldPrice ?? (current.old_price !== null ? Number(current.old_price) : undefined),
      stock: input.stock ?? current.stock, region: input.region ?? current.region,
      tags: input.tags ?? current.tags, image: input.image ?? current.image,
    };
    const clean = validateProductInput(merged);
    const stockDelta = Number(clean.stock) - Number(current.stock);
    if (stockDelta !== 0) await adjustInventoryTransactionTx(client as any, { productId, delta: stockDelta, idempotencyKey: `catalog-stock:${productId}:${current.stock}:${clean.stock}`, source: 'MERCHANT_CATALOG_STOCK_EDIT', metadata: { merchantId } });
    const result = await client.query(
      `update trust_products set name=$1,category=$2,price=$3,old_price=$4,region=$5,tags=$6,image=$7,updated_at=now()
       where id=$8 returning id,merchant_id,name,category,price,old_price,stock,region,tags,image,rating`,
      [clean.name, clean.category, clean.price, clean.oldPrice, clean.region, clean.tags, clean.image, productId]
    );
    const storeName = await client.query(`select store_name from trust_merchant_profiles where id=$1`, [merchantId]);
    return mapRow({ ...result.rows[0], store_name: storeName.rows[0]?.store_name ?? '' });
  });
}
