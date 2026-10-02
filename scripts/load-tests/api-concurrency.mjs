const base = process.env.BASE_URL || 'http://localhost:3000';
const path = process.env.PATH_TO_TEST || '/api/health';
const concurrency = Number(process.env.CONCURRENCY || 100);
const rounds = Number(process.env.ROUNDS || 10);
const samples=[]; let failures=0;
for(let r=0;r<rounds;r++){
  const started=Date.now();
  const results=await Promise.all(Array.from({length:concurrency},async()=>{const t=Date.now();try{const res=await fetch(base+path,{cache:'no-store'}); samples.push(Date.now()-t); if(!res.ok) failures++; return res.status;}catch{failures++;return 0;}}));
  console.log(JSON.stringify({round:r+1,concurrency,elapsedMs:Date.now()-started,statuses:results.reduce((a,s)=>(a[s]=(a[s]||0)+1,a),{})}));
}
samples.sort((a,b)=>a-b); const pct=p=>samples[Math.min(samples.length-1,Math.floor(samples.length*p))];
console.log(JSON.stringify({ok:failures===0,requests:samples.length,failures,p50:pct(.5),p95:pct(.95),p99:pct(.99),max:samples.at(-1)}));
if(failures) process.exitCode=1;
