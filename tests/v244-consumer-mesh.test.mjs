import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contracts = fs.readFileSync(path.join(root, 'modules/platform/commerce-events/contracts.ts'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'scripts/commerce_consumer_mesh.mjs'), 'utf8');
const consumers = ['order','payment','inventory','fulfillment','returns','notification','customer'];
for (const id of consumers) {
  assert.match(contracts, new RegExp(`id: '${id}'`));
  const source = fs.readFileSync(path.join(root, `modules/commerce/consumers/${id}.ts`), 'utf8');
  assert.doesNotMatch(source, /CONSUMER_HANDLER_NOT_WIRED/);
  assert.match(source, /runEffect/);
}
assert.match(worker, /claimDelivery/);
assert.match(worker, /completeDelivery/);
assert.match(worker, /retryDelivery/);
assert.doesNotMatch(worker, /status:\s*['"]PROCESSED['"]\s*\}/);
console.log('V244 consumer mesh contract: PASS');
