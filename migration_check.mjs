import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd(); const dir=path.join(root,'db','migrations');
const files=fs.readdirSync(dir).filter(f=>/^\d{3}_.+\.sql$/.test(f)).sort(); const nums=files.map(f=>Number(f.slice(0,3)));
const errors=[]; if(!files.length)errors.push('No canonical migrations found');
const unique=new Set(nums); if(unique.size!==nums.length)errors.push('Duplicate migration numbers');
nums.forEach((n,i)=>{const expected=i+1; if(n!==expected)errors.push(`Non-contiguous migration sequence at ${files[i]}`)});
const hashes={}; for(const f of files){const s=fs.readFileSync(path.join(dir,f));hashes[f]=crypto.createHash('sha256').update(s).digest('hex');}
if(fs.existsSync(path.join(dir,'MANIFEST.json'))){const manifest=JSON.parse(fs.readFileSync(path.join(dir,'MANIFEST.json'),'utf8'));for(const f of files){if(manifest.migrations?.find(x=>x.file===f)?.checksum!==hashes[f])errors.push(`Manifest checksum mismatch: ${f}`);}}
if(errors.length){console.error('Migration check FAILED');errors.forEach(e=>console.error('- '+e));process.exit(1)}
console.log(`Migration check PASS — ${files.length} canonical migrations, contiguous identity, checksum manifest compatible.`);
