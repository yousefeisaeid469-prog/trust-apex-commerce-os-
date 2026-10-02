import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverProducts } from '../modules/platform/discovery/core.ts';

const products = [
  { id:'1', name:'Heavy Black Hoodie', category:'Hoodies', price:1200, oldPrice:1600, merchant:'Alpha', rating:4.8, stock:50, region:'EG', tags:['black','night','oversized'] },
  { id:'2', name:'Black Cargo Pants', category:'Pants', price:900, merchant:'Beta', rating:4.7, stock:30, region:'EG', tags:['black','cargo'] },
  { id:'3', name:'Blue Hoodie', category:'Hoodies', price:1000, merchant:'Gamma', rating:4.2, stock:0, region:'EG', tags:['blue'] },
  { id:'4', name:'Night Oversized Hoodie', category:'Hoodies', price:1400, merchant:'Delta', rating:4.6, stock:15, region:'SA', tags:['night','oversized'] },
];

test('V162 discovery ranks exact name matches above broad matches', () => {
  const result = discoverProducts(products, { q:'Heavy Black Hoodie' });
  assert.equal(result.hits[0].product.id, '1');
  assert.ok(result.hits[0].score > result.hits[1].score);
});

test('V162 discovery normalizes Arabic and supports fuzzy tokens', () => {
  const result = discoverProducts([{ ...products[0], name:'هودي أسود تقيل' }], { q:'هودي اسود تقيل' });
  assert.equal(result.total, 1);
});

test('V162 discovery applies commerce filters', () => {
  const result = discoverProducts(products, { q:'hoodie', filters:{ inStock:true, minRating:4.5, region:'EG' } });
  assert.deepEqual(result.hits.map(x => x.product.id), ['1']);
});

test('V162 discovery uses local-session personalization without requiring identity', () => {
  const result = discoverProducts(products, { q:'black', context:{ recentProductIds:['2'] } });
  assert.equal(result.hits[0].product.id, '2');
  assert.ok(result.hits[0].reasons.includes('recently viewed'));
});

test('V162 discovery returns stable pagination metadata', () => {
  const result = discoverProducts(products, { limit:2, page:2 });
  assert.equal(result.limit, 2);
  assert.equal(result.page, 2);
  assert.equal(result.pages, 2);
  assert.equal(result.hits.length, 2);
});
