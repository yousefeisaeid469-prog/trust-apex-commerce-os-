import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { rankSearchScore, normalizeSearch } from '../modules/marketplace/discovery-ranking.ts';

test('V271 discovery normalizes Arabic search and ranking is bounded',()=>{
  assert.equal(normalizeSearch('آيفون — جديد'),'ايفون جديد');
  const score=rankSearchScore({textRank:1,rating:5,stock:10,price:100,oldPrice:150});
  assert.ok(score>0 && score<=1);
});

test('V271 customer-facing discovery surface is real',()=>{
  for(const f of ['app/shop/page.tsx','app/product/[id]/page.tsx','app/api/marketplace/search/route.ts','app/api/marketplace/products/[id]/route.ts','modules/marketplace/discovery.ts','modules/marketplace/discovery-ranking.ts','db/migrations/108_v271_marketplace_discovery.sql']) assert.ok(fs.existsSync(f),f);
  const route=fs.readFileSync('app/api/marketplace/search/route.ts','utf8');
  assert.match(route,/searchMarketplace/);
  const migration=fs.readFileSync('db/migrations/108_v271_marketplace_discovery.sql','utf8');
  assert.match(migration,/trust_marketplace_search_events/);
});
