import fs from 'node:fs';
const read=f=>fs.readFileSync(f,'utf8');
const checks=[
 ['migration','db/migrations/222_v397_unified_commerce_command_surface.sql',['trust_commerce_command_snapshot','SELLER_SPLIT_MISSING','SELLER_SPLIT_TOTAL_MISMATCH','CAPTURED_WITHOUT_FULFILLMENT']],
 ['module','modules/platform/order-journey-os/command-snapshot.ts',['getCommerceCommandSnapshot','trust_commerce_command_snapshot']],
 ['api','app/api/commerce/journey/[id]/route.ts',['UNIFIED_COMMERCE_JOURNEY','getCommerceCommandSnapshot','getOrderJourney']],
 ['buyer','app/orders/[id]/page.tsx',['/api/commerce/journey/','data.journey.order','data.journey.items']],
];
const errors=[]; for(const [name,file,tokens] of checks){const s=read(file);for(const t of tokens)if(!s.includes(t))errors.push(`${name}:${t}`)}
if(errors.length){console.error('V397 CONTRACT CHECK FAIL');errors.forEach(e=>console.error('- '+e));process.exit(1)}
console.log('V397 CONTRACT CHECK PASS — unified commerce journey surface is structurally wired.');
