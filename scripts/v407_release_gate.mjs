import fs from 'node:fs';
const version=JSON.parse(fs.readFileSync('package.json','utf8')).version;
if(version!=='407.0.0') throw new Error(`PACKAGE_VERSION_DRIFT:${version}`);
const runtime=fs.readFileSync('lib/runtime/version.ts','utf8');
if(!runtime.includes('V407.0.0')) throw new Error('RUNTIME_VERSION_DRIFT');
if(!fs.existsSync('db/migrations/232_v407_global_runtime_spine.sql')) throw new Error('MIGRATION_232_MISSING');
const manifest=JSON.parse(fs.readFileSync('db/migrations/MANIFEST.json','utf8')); if(manifest.version!=='V407.0.0'||manifest.generatedFor!=='V407.0.0') throw new Error('MIGRATION_MANIFEST_VERSION_DRIFT');
console.log('V407 RELEASE GATE PASS — version, runtime marker and migration 232 present.');
