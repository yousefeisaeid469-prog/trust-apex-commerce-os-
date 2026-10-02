import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCommerceAiCopilot,classifyCopilot} from '../modules/platform/commerce-ai-copilot/core.ts';
const products=[{id:'a',name:'Black Hoodie',category:'Clothing',price:500,oldPrice:650,merchant:'A',rating:4.8,stock:20,region:'EG',tags:['black','hoodie']},{id:'b',name:'Black Hoodie Premium',category:'Clothing',price:700,merchant:'B',rating:4.9,stock:4,region:'EG',tags:['black','hoodie']}];
test('V207 classifies shopper intent deterministically',()=>{const c=classifyCopilot('قارن أفضل هودي أسود', 'SHOP');assert.equal(c.mode,'SHOP');assert.equal(c.intent,'COMPARE');assert.ok(c.confidence>=80)});
test('V207 composes real catalog intelligence',()=>{const r=buildCommerceAiCopilot({message:'أفضل هودي أسود',products});assert.equal(r.version,'V207');assert.equal(r.products.length,2);assert.ok(r.actions.some(a=>a.id==='compare'));assert.ok(r.signals.some(s=>s.id==='intent'))});
test('V207 keeps sensitive execution outside copilot',()=>{const r=buildCommerceAiCopilot({message:'عاوز ارجع الطلب',products});assert.equal(r.intent,'RETURN');assert.equal(r.actions[0].requiresApproval,false);assert.ok(r.guardrails.some(x=>x.includes('استرداد')));assert.ok(r.actions.some(a=>a.target==='/problem-center'))});
test('V207 routes seller inventory requests to Seller Super OS',()=>{const r=buildCommerceAiCopilot({message:'انا تاجر والمخزون قرب ينفد',products});assert.equal(r.mode,'SELL');assert.equal(r.intent,'INVENTORY');assert.ok(r.actions.some(a=>a.target==='/seller-super-os'))});
