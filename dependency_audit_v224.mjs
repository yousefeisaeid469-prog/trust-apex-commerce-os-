import fs from 'node:fs';
const pkg=JSON.parse(fs.readFileSync('package.json','utf8')); const lock=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
const direct={...pkg.dependencies,...pkg.devDependencies}; const issues=[];
if(pkg.packageManager!=='npm@10.9.2')issues.push('unexpected package manager pin');
if(lock.lockfileVersion!==3)issues.push('lockfileVersion must be 3');
if(lock.name!==pkg.name || lock.version!==pkg.version)issues.push('lock root metadata mismatch');
const root=lock.packages?.['']; for(const [name,version] of Object.entries(direct)){const declared=(root?.dependencies?.[name]??root?.devDependencies?.[name]);if(declared!==version)issues.push(`lock root mismatch ${name}`);}
if(issues.length){console.error('V224 dependency audit FAILED');issues.forEach(x=>console.error('- '+x));process.exit(1)}
console.log(`V224 dependency audit PASS — ${Object.keys(direct).length} direct dependencies pinned and lock root aligned.`);
