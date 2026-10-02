import fs from 'node:fs';
const review=fs.readFileSync('modules/customer-experience/reviews.ts','utf8');
const tracking=fs.readFileSync('modules/platform/fulfillment-tracking-3/core.ts','utf8');
const os=fs.readFileSync('modules/customer-experience/post-purchase-os.ts','utf8');
if(!review.includes("o.status='delivered'"))throw new Error('review eligibility is not delivery-gated');
if(!review.includes('REVIEW_REQUIRES_DELIVERED_PURCHASE'))throw new Error('undelivered review is not rejected');
if(!tracking.includes('delivery-loyalty:'))throw new Error('delivery loyalty idempotency missing');
if(!os.includes('getReviewEligibility')||!os.includes('getLoyaltyEligibility'))throw new Error('post purchase eligibility runtime missing');
console.log('V389 POST-PURCHASE OS TEST PASS — 4/4');
