import fs from 'node:fs';
const f='docs/acquisition/BUYER-DUE-DILIGENCE-PACK-V138.md'; if(!fs.existsSync(f)) {console.error('BUYER PACK FAIL');process.exit(1)}
const s=fs.readFileSync(f,'utf8'); for(const x of ['Architecture','Security','Financial integrity','SLO','IP and licensing','Known limitations','Evidence']) if(!s.includes(x)){console.error(`Missing buyer-pack section: ${x}`);process.exit(1)}
console.log('TRUST V139 buyer due-diligence pack PASS.');
