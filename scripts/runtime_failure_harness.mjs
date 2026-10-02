import assert from 'node:assert/strict';
import { canTransition } from '../modules/commerce/payments/state-machine.ts';

const scenarios = [
  { name:'duplicate payment success webhook', run(){ assert.equal(canTransition('captured','captured'),true); } },
  { name:'out-of-order refund before capture', run(){ assert.equal(canTransition('pending','refunded'),false); } },
  { name:'failed payment cannot be refunded', run(){ assert.equal(canTransition('failed','refunded'),false); } },
  { name:'captured payment can partially refund', run(){ assert.equal(canTransition('captured','partially_refunded'),true); } },
  { name:'partial refund can settle fully', run(){ assert.equal(canTransition('partially_refunded','refunded'),true); } },
];
for (const s of scenarios) s.run();
console.log(`Runtime failure harness PASS — ${scenarios.length} deterministic financial failure scenarios`);
