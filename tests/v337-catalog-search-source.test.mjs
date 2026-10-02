import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync('db/migrations/171_v337_catalog_search_runtime.sql', 'utf8');
const repo = fs.readFileSync('modules/commerce/repository/catalog.ts', 'utf8');
const route = fs.readFileSync('app/api/products/route.ts', 'utf8');

test('V337 catalog search runtime source wiring is complete', () => {
  assert.match(migration, /search_vector tsvector/);
  assert.match(migration, /USING GIN \(search_vector\)/);
  assert.match(repo, /websearch_to_tsquery/);
  assert.match(repo, /ts_rank_cd/);
  assert.match(repo, /price_asc/);
  assert.match(repo, /price_desc/);
  assert.match(repo, /rating/);
  assert.match(repo, /inStock/);
  assert.match(repo, /facets/);
  assert.match(route, /minPrice/);
  assert.match(route, /maxPrice/);
  assert.match(route, /inStock/);
  assert.match(route, /facets/);
});
