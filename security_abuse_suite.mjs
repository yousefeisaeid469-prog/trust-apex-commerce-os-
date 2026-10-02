import assert from 'node:assert/strict';
const classify=s=>{if(s.authFailures>=10||s.duplicateRate>=.8)return'deny';if(s.velocity>=60||s.authFailures>=5||s.duplicateRate>=.5)return'challenge';return'allow'};
const cases=[['clean','allow',{velocity:5,duplicateRate:0,authFailures:0}],['velocity','challenge',{velocity:61,duplicateRate:0,authFailures:0}],['credential-abuse','deny',{velocity:1,duplicateRate:0,authFailures:10}],['replay-storm','deny',{velocity:10,duplicateRate:.8,authFailures:0}],['suspicious-replay','challenge',{velocity:10,duplicateRate:.5,authFailures:0}]];
for(const [name,expected,s] of cases)assert.equal(classify(s),expected,name);console.log(`TRUST V139 security abuse suite PASS — ${cases.length}/${cases.length}`);
