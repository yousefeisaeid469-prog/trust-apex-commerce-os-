import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
test('V374 unified commerce OS runtime surface exists',()=>{for(const f of ['modules/platform/unified-commerce-os/core.ts','app/api/commerce/os/overview/route.ts','app/unified-commerce-os/page.tsx','db/migrations/203_v374_unified_commerce_os.sql'])assert.equal(fs.existsSync(f),true,f);});
