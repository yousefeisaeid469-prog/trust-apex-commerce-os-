import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const scanRoots=['modules','app'];
const files=[];
function walk(dir){for(const name of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,name.name);if(name.isDirectory()){walk(p);continue;}if(/\.(ts|tsx)$/.test(name.name))files.push(p);}}
for(const dir of scanRoots) walk(path.join(root,dir));
const patterns=[/update\s+(?:trust_products|trust_marketplace_offers|trust_fulfillment_inventory)\s+set[\s\S]{0,500}\bstock\s*=/i,/insert\s+into\s+(?:trust_inventory_ledger|trust_marketplace_inventory_movements)/i];
const violations=[];
for(const file of files){
  if(file.endsWith('modules/commerce/inventory/transaction-engine.ts')) continue;
  const text=fs.readFileSync(file,'utf8');
  for(const re of patterns) if(re.test(text)) violations.push(path.relative(root,file));
}
const unique=[...new Set(violations)].sort();
if(unique.length){console.error('V403 INVENTORY MUTATION CLOSURE FAIL'); for(const f of unique) console.error(' - '+f); process.exit(1);}
console.log('V403 INVENTORY MUTATION CLOSURE PASS — mutable inventory SQL is centralized in transaction-engine.ts');
