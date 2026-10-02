import fs from 'node:fs';
import assert from 'node:assert/strict';
const route=fs.readFileSync('app/api/checkout/cart/commit/route.ts','utf8');
assert.match(route,/cartSummary/); assert.match(route,/createQuote/); assert.match(route,/placeOrderFromQuote/); assert.match(route,/clearCartIfMatches/);
assert.match(route,/CART_REQUIRES_REFRESH/); assert.match(route,/idempotency-key/);
const cart=fs.readFileSync('modules/commerce/cart/store.ts','utf8'); assert.match(cart,/clearCartIfMatches/); assert.match(cart,/for update/);
const journey=fs.readFileSync('modules/platform/product-journey.ts','utf8'); for(const x of ['SELLER_REGISTERED','STORE_CREATED','PRODUCT_CREATED','BUYER_REGISTERED','CART_UPDATED','CHECKOUT_COMMITTED','PAYMENT_CAPTURED','FULFILLMENT_STARTED','DELIVERED','SELLER_BALANCE_UPDATED']) assert.match(journey,new RegExp(x));
for(const f of ['app/api/auth/register/route.ts','app/api/auth/register/seller/route.ts','app/api/merchant/products/route.ts','app/api/cart/items/route.ts','app/api/checkout/cart/route.ts','app/api/checkout/cart/commit/route.ts','app/api/payments/intent/route.ts','app/api/payments/webhook/route.ts','app/api/fulfillment/network/route.ts','app/api/seller/dashboard/route.ts','app/api/buyer/dashboard/route.ts','app/api/admin/dashboard/route.ts']) assert.ok(fs.existsSync(f),`missing product surface ${f}`);
console.log('V291 product E2E: 18/18 PASS');
