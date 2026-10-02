import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const discovery=fs.readFileSync('modules/marketplace/discovery.ts','utf8');
const route=fs.readFileSync('app/api/marketplace/search/route.ts','utf8');
const shop=fs.readFileSync('app/shop/page.tsx','utf8');
test('V338 discovery filters and indexed search are wired',()=>{
 assert.match(discovery,/p\.search_vector @@ websearch_to_tsquery/);
 assert.match(discovery,/minRating/); assert.match(discovery,/tag/); assert.match(discovery,/inStock/);
 assert.match(discovery,/facets/); assert.match(discovery,/where \$\{predicate\}/);
 assert.match(route,/tag:p\.get\('tag'\)/);
 assert.match(shop,/minPrice/); assert.match(shop,/maxPrice/); assert.match(shop,/minRating/); assert.match(shop,/inStock/); assert.match(shop,/facets/);
});
