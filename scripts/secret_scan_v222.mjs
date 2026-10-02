import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd(); const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name); if(e.isDirectory()&&!['node_modules','.next','.git'].includes(e.name))walk(p); else if(e.isFile()&&/\.(ts|tsx|js|mjs|json|env|md)$/.test(e.name))files.push(p);}}
walk(root);
const patterns=[/AKIA[0-9A-Z]{16}/,/-----BEGIN (?:RSA|EC|OPENSSH|PRIVATE) KEY-----/,/(?:api[_-]?key|secret|token|password)\s*[:=]\s*['"][A-Za-z0-9_\-]{24,}['"]/i];
const hits=[]; for(const f of files){if(f.includes('package-lock.json'))continue; const s=fs.readFileSync(f,'utf8'); for(const re of patterns) if(re.test(s)){hits.push(path.relative(root,f));break;}}
console.log(`TRUST V222 secret scan — ${files.length} files scanned`);
if(hits.length){console.error(`FAIL — ${hits.length} potential secret-bearing files`); hits.forEach(x=>console.error('- '+x)); process.exit(1);} console.log('PASS — no high-confidence embedded-secret patterns found.');
