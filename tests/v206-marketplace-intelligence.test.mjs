import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMarketplaceIntelligence, rankMarketplaceIntelligence } from '../modules/platform/marketplace-intelligence/core.ts';
const products=[
{id:'a',name:'Black Hoodie',category:'Clothing',price:500,oldPrice:650,merchant:'A',rating:4.8,stock:20,region:'EG',tags:['black','hoodie']},
{id:'b',name:'Black Hoodie Premium',category:'Clothing',price:700,merchant:'B',rating:4.9,stock:4,region:'EG',tags:['black','hoodie']},
{id:'c',name:'Red Shoes',category:'Shoes',price:900,merchant:'C',rating:4.2,stock:0,region:'EG',tags:['red','shoes']},
];
test('V206 ranks query relevance and trust',()=>{const r=rankMarketplaceIntelligence(products,{q:'black hoodie',inStock:true});assert.equal(r.length,2);assert.equal(r[0].id,'a');assert.ok(r[0].match>70);assert.ok(r[0].trust>90)});
test('V206 applies filters before ranking',()=>{const r=rankMarketplaceIntelligence(products,{category:'Shoes',inStock:true});assert.equal(r.length,0)});
test('V206 produces explainable insights',()=>{const s=buildMarketplaceIntelligence(products,{q:'hoodie'});assert.equal(s.version,'V206');assert.equal(s.mode,'search');assert.ok(s.insights.some(x=>x.id==='DEAL_DISCOVERY'));assert.ok(s.insights.some(x=>x.id==='MONETIZATION_READY'));assert.ok(s.offers.every(x=>x.reasons.length>0))});
test('V206 keeps sponsored promotion separate',()=>{const s=buildMarketplaceIntelligence(products,{});const x=s.insights.find(i=>i.id==='MONETIZATION_READY');assert.ok(x);assert.match(x.guardrail,/الإعلان|sponsored/i)});
