import test from 'node:test';
import assert from 'node:assert/strict';
import { rankOffers, selectBestOffer, selectVariant, reserveInventory, isReservationActive } from '../modules/platform/marketplace-offers/index.ts';

const offers=[
 {id:'a',productId:'p',sellerId:'slow',priceMinor:1000n,currency:'EGP',stock:20,rating:4.9,handlingDays:3,deliveryDays:5,condition:'NEW'},
 {id:'b',productId:'p',sellerId:'fast',priceMinor:1100n,currency:'EGP',stock:12,rating:4.8,handlingDays:1,deliveryDays:1,condition:'NEW'},
];
test('V163 ranks the best marketplace offer across price, trust and speed',()=>{assert.equal(selectBestOffer(offers)?.id,'b');});
test('V163 filters unavailable or wrong-currency offers',()=>{assert.equal(rankOffers([...offers,{id:'c',productId:'p',sellerId:'x',priceMinor:1n,currency:'USD',stock:0,rating:5,handlingDays:0,deliveryDays:0,condition:'NEW'}],{currency:'EGP'}).length,2);});
test('V163 selects an in-stock variant by attributes',()=>{const v=selectVariant([{id:'1',sku:'S-B',attributes:{size:'S',color:'black'},priceMinor:1n,currency:'EGP',stock:0},{id:'2',sku:'M-B',attributes:{size:'M',color:'black'},priceMinor:1n,currency:'EGP',stock:4}],{size:'M',color:'black'});assert.equal(v?.id,'2');});
test('V163 creates expiring inventory reservations',()=>{const r=reserveInventory(5,2,300,new Date('2026-01-01T00:00:00Z'));assert.equal(r.quantity,2);assert.equal(isReservationActive(r,new Date('2026-01-01T00:04:00Z')),true);assert.equal(isReservationActive(r,new Date('2026-01-01T00:06:00Z')),false);});
test('V163 rejects over-reservation',()=>{assert.throws(()=>reserveInventory(1,2),/INSUFFICIENT_INVENTORY/);});
