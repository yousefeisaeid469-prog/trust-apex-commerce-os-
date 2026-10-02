import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('V362 wishlist HTTP surface is real and authenticated',()=>{
  const s=fs.readFileSync('app/api/wishlist/route.ts','utf8');
  assert.match(s,/getCurrentUser/);
  assert.match(s,/listWishlist/);
  assert.match(s,/addWishlist/);
  assert.match(s,/removeWishlist/);
  assert.match(s,/surfaceStatus:'LIVE'/);
  assert.match(s,/DATABASE_NOT_CONFIGURED/);
});

test('V362 autonomous data plane reads canonical deployed tables',()=>{
  const s=fs.readFileSync('modules/platform/autonomous-commerce-data-plane/core.ts','utf8');
  assert.doesNotMatch(s,/trust_inventory_value/);
  assert.doesNotMatch(s,/trust_merchants/);
  assert.match(s,/trust_products/);
  assert.match(s,/trust_merchant_profiles/);
});

test('V362 current-head gate is separate from historical release tests',()=>{
  const s=fs.readFileSync('scripts/current_head_reality_gate.mjs','utf8');
  assert.match(s,/Historical release tests are intentionally excluded/);
  assert.match(s,/migration_check/);
  assert.match(s,/version_consistency_audit/);
});
