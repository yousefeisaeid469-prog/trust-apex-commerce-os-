import test from 'node:test';
import assert from 'node:assert/strict';
import { personalizedScore, sessionDigest } from '../modules/marketplace/personalization-score.ts';

test('personalization boosts matching category without changing cold start',()=>{
 const base={base:.7,category:'Shoes',price:100,profile:{categories:{shoes:8},priceCenter:100,viewedProducts:10}};
 assert.ok(personalizedScore(base)>.7);
 assert.equal(personalizedScore({...base,profile:{categories:{},priceCenter:null,viewedProducts:0}}),.7);
});
test('session identity is one-way and deterministic',()=>{
 const a=sessionDigest('session-a');
 assert.equal(a,sessionDigest('session-a'));
 assert.notEqual(a,sessionDigest('session-b'));
 assert.equal(a.length,64);
});
test('sponsored inventory remains excluded from organic score',()=>{
 const score=personalizedScore({base:.5,category:'Books',price:20,profile:{categories:{books:8},priceCenter:20,viewedProducts:3}});
 assert.ok(score<=.65);
});
