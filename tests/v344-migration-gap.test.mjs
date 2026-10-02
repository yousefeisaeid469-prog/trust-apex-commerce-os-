import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const dir = path.join(root, 'db', 'migrations');
const files = fs.readdirSync(dir)
  .filter((f) => /^\d{3}_.+\.sql$/.test(f))
  .sort();
const nums = files.map((f) => Number(f.slice(0, 3)));

assert.ok(files.length > 0, 'canonical migrations must exist');
assert.deepEqual(nums, Array.from({ length: files.length }, (_, i) => i + 1));
assert.equal(files[167], '168_v330_v331_historical_bridge.sql');
assert.match(
  fs.readFileSync(path.join(dir, files[167]), 'utf8'),
  /SELECT 1;/i,
);

const migrationCheck = fs.readFileSync(
  path.join(root, 'scripts', 'migration_check.mjs'),
  'utf8',
);
assert.doesNotMatch(migrationCheck, /allowedHistoricalGaps|expected = i>=167 \? i\+2/);
assert.match(migrationCheck, /const expected=i\+1/);

const migrate = fs.readFileSync(path.join(root, 'scripts', 'migrate.mjs'), 'utf8');
assert.match(migrate, /n!==i\+1/);

console.log(`V344 migration-gap regression PASS — ${files.length} contiguous migrations; 168 restored.`);
