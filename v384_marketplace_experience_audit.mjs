import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const required=[
 'app/api/catalog/search/route.ts',
 'app/api/catalog/suggestions/route.ts',
 'app/api/marketplace/search/route.ts',
 'modules/marketplace/discovery.ts',
 'app/shop/page.tsx',
 'components/trust-os-shell.tsx'
];
const missing=required.filter(x=>!fs.existsSync(path.join(root,x)));
if(missing.length){console.error('V384 MARKETPLACE EXPERIENCE AUDIT FAILED');missing.forEach(x=>console.error('- '+x));process.exit(1)}
const search=fs.readFileSync(path.join(root,'app/api/catalog/search/route.ts'),'utf8');
const suggestions=fs.readFileSync(path.join(root,'app/api/catalog/suggestions/route.ts'),'utf8');
const shop=fs.readFileSync(path.join(root,'app/shop/page.tsx'),'utf8');
const forbidden=['ساعة TRUST Signature','جاكيت Premium Essential','سماعات APEX Pro','حقيبة Executive Leather'];
for(const x of forbidden) if(search.includes(x)) { console.error('static demo catalog leaked into canonical search'); process.exit(1); }
for(const x of ['searchMarketplace','trust_marketplace_session','Cache-Control']) if(!search.includes(x)){console.error('catalog search missing '+x);process.exit(1)}
for(const x of ['searchMarketplace','suggestions','limit:8']) if(!suggestions.includes(x)){console.error('suggestions missing '+x);process.exit(1)}
for(const x of ['/api/marketplace/search','setItems','setFacets']) if(!shop.includes(x)){console.error('shop integration missing '+x);process.exit(1)}
console.log('V384 MARKETPLACE EXPERIENCE AUDIT PASS — 10/10');
