import fs from 'node:fs';
const required=['modules/platform/v316/index.ts','modules/platform/v316/marketplace/contracts.ts','modules/platform/v316/marketplace/engine.ts','modules/platform/v316/marketplace/runtime.ts','app/api/platform/v316/marketplace/route.ts','db/migrations/154_v316_marketplace_os_vertical_slice.sql','tests/v316-marketplace-os.test.mjs','docs/architecture/MARKETPLACE-OS-V316.md','docs/releases/MASTER-RELEASE-V316.md','artifacts/v316/marketplace-os-evidence.json'];
const missing=required.filter(f=>!fs.existsSync(f)); if(missing.length){console.error('V316 AUDIT FAILED');missing.forEach(x=>console.error('- '+x));process.exit(1)}
const a=JSON.parse(fs.readFileSync('artifacts/v316/marketplace-os-evidence.json','utf8'));
if(a.version!=='V316.0.0'||a.status!=='PASS'||a.liveExternalProviders!==false)throw new Error('V316 evidence claims invalid');
console.log(`V316 audit PASS — ${required.length} critical artifacts verified.`);
