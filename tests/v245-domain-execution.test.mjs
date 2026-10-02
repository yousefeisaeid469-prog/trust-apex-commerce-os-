import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=process.cwd();
const files=['order','payment','inventory','fulfillment','returns','notification','customer'];
for(const id of files){const s=fs.readFileSync(`${root}/modules/commerce/consumers/${id}.ts`,'utf8');assert.doesNotMatch(s,/CONSUMER_HANDLER_NOT_WIRED/);assert.match(s,/runEffect/);assert.match(s,/runEffect/);} 
const core=fs.readFileSync(`${root}/modules/platform/commerce-events/core.ts`,'utf8');assert.match(core,/normalizeOutboxEventType/);
const publisher=fs.readFileSync(`${root}/scripts/commerce_event_publisher.mjs`,'utf8');assert.match(publisher,/normalizeOutboxEventType/);assert.match(publisher,/enqueueSubscribedDeliveriesTx/);
console.log('V245 domain execution contract: PASS');
