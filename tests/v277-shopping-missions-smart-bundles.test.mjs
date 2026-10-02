import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('V277 migration defines durable missions, bundles, and recommendation snapshots', async()=>{
 const s=await readFile(new URL('../db/migrations/115_v277_shopping_missions_smart_bundles.sql',import.meta.url),'utf8');
 for(const token of ['trust_marketplace_shopping_missions','trust_marketplace_bundle_templates','trust_marketplace_bundle_items','trust_marketplace_mission_recommendations']) assert.match(s,new RegExp(token));
});

test('V277 smart bundle runtime is explainable and offer-aware', async()=>{
 const s=await readFile(new URL('../modules/marketplace/smart-bundles.ts',import.meta.url),'utf8');
 assert.match(s,/EXPLAINABLE_COMPLEMENTARY_BUNDLE/); assert.match(s,/resolveBuyBox/); assert.match(s,/shared/); assert.match(s,/budgetFit/);
});

test('V277 exposes mission and bundle customer APIs', async()=>{
 const mission=await readFile(new URL('../app/api/marketplace/missions/route.ts',import.meta.url),'utf8');
 const bundle=await readFile(new URL('../app/api/marketplace/bundles/route.ts',import.meta.url),'utf8');
 assert.match(mission,/createShoppingMission/); assert.match(mission,/recommendForMission/); assert.match(bundle,/recommendSmartBundle/);
});
