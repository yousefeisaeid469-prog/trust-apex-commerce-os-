import fs from 'node:fs';
import assert from 'node:assert/strict';
const migration=fs.readFileSync('db/migrations/158_v320_commerce_monetization.sql','utf8');
const service=fs.readFileSync('modules/platform/v320/revenue.ts','utf8');
for(const table of ['trust_revenue_ledger','trust_ad_campaigns','trust_ad_events','trust_subscription_plans','trust_merchant_subscriptions']) assert.match(migration,new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
for(const token of ['withPgTransaction','idempotency_key','recordCommission','recordAdEvent','createMerchantSubscription','DAILY_AD_BUDGET_EXCEEDED','setAdCampaignStatus']) assert.match(service,new RegExp(token));
assert.match(service,/for update/i);
console.log('V320 monetization source tests PASS');
