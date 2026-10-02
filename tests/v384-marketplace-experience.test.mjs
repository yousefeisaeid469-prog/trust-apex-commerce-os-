import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const search=read('app/api/catalog/search/route.ts');
const suggest=read('app/api/catalog/suggestions/route.ts');
if(search.includes("const products = [")||search.includes('watch')) throw new Error('catalog search still contains static demo products');
if(!search.includes('searchMarketplace')) throw new Error('catalog search is not backed by marketplace discovery');
if(!suggest.includes('searchMarketplace')) throw new Error('suggestions are not backed by marketplace discovery');
console.log('V384 MARKETPLACE EXPERIENCE TEST PASS — 1/1');
