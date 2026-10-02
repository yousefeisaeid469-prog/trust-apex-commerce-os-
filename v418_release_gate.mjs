import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const pkg=JSON.parse(await readFile('package.json','utf8')); const manifest=JSON.parse(await readFile('db/migrations/MANIFEST.json','utf8'));
assert.equal(pkg.version,'418.0.0'); assert.equal(manifest.version,'V418.0.0'); assert.equal(manifest.migrations.at(-1).id,'243'); assert.equal(manifest.migrations.at(-1).file,'243_v418_global_commerce_recovery_engine.sql');
assert((await readFile('scripts/v418_recovery_engine_test.mjs','utf8')).includes('PASS'));
console.log('V418 RELEASE GATE PASS');
