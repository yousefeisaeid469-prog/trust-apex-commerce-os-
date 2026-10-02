import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const files=fs.readdirSync('db/migrations').filter(f=>/^\d{3}_.+\.sql$/.test(f)).sort();
test('canonical migrations are contiguous and unique',()=>{const nums=files.map(f=>Number(f.slice(0,3)));assert.equal(new Set(nums).size,nums.length);nums.forEach((n,i)=>assert.equal(n,i+1));});
test('legacy duplicate prevention migration is archived, not deleted from history',()=>{assert.equal(fs.existsSync('db/migrations/archive/legacy-duplicates/011_v125_prevention_os.sql'),true);});
test('canonical manifest exists',()=>{assert.equal(fs.existsSync('db/migrations/MANIFEST.json'),true);});
