import assert from 'node:assert/strict';
import { cellForTenant } from '../modules/platform/cells/router.ts';

const a = cellForTenant('tenant-alpha', 16);
const b = cellForTenant('tenant-alpha', 16);
assert.equal(a, b, 'tenant routing must be deterministic');
assert.match(a, /^cell-\d{3}$/);
assert.notEqual(cellForTenant('tenant-alpha', 16), undefined);
assert.throws(() => cellForTenant('', 16), /INVALID_CELL_ROUTING_CONFIG/);
assert.throws(() => cellForTenant('tenant-alpha', 0), /INVALID_CELL_ROUTING_CONFIG/);
assert.throws(() => cellForTenant('tenant-alpha', 10001), /INVALID_CELL_ROUTING_CONFIG/);
console.log('V241 cell scaling test PASS — deterministic tenant routing and invalid configuration guards verified.');
