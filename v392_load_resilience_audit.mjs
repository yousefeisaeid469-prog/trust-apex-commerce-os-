import fs from 'node:fs';
const read=f=>fs.readFileSync(f,'utf8'); const errors=[];
const load=read('scripts/v392_load_resilience.mjs');
for(const token of ['concurrency','failureRate','committed','attempt <= 3','DEDUPED','assert.equal']) if(!load.includes(token)) errors.push('missing resilience invariant '+token);
const pkg=JSON.parse(read('package.json'));
if(pkg.version!=='392.0.0') errors.push('package version');
if(!pkg.scripts['load-resilience']) errors.push('load-resilience script');
if(errors.length){console.error('V392 LOAD RESILIENCE AUDIT FAILED\n- '+errors.join('\n- '));process.exit(1)}
console.log('V392 LOAD RESILIENCE AUDIT PASS');
