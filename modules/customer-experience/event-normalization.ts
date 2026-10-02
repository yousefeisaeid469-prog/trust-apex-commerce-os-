import { validateEventName } from './events';

export function normalizeEvent1(input: any): any {
  const name='VIEWED_PRODUCT';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent2(input: any): any {
  const name='SEARCHED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent3(input: any): any {
  const name='ADDED_TO_CART';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent4(input: any): any {
  const name='REMOVED_FROM_CART';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent5(input: any): any {
  const name='CHECKOUT_STARTED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent6(input: any): any {
  const name='CHECKOUT_COMPLETED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent7(input: any): any {
  const name='ORDER_VIEWED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent8(input: any): any {
  const name='SHIPMENT_VIEWED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent9(input: any): any {
  const name='RETURN_STARTED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent10(input: any): any {
  const name='RETURN_COMPLETED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent11(input: any): any {
  const name='REVIEW_VIEWED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent12(input: any): any {
  const name='REVIEW_SUBMITTED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent13(input: any): any {
  const name='SUPPORT_OPENED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent14(input: any): any {
  const name='SUPPORT_RESOLVED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent15(input: any): any {
  const name='PREFERENCE_CHANGED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent16(input: any): any {
  const name='WISHLIST_ADDED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent17(input: any): any {
  const name='WISHLIST_REMOVED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent18(input: any): any {
  const name='VIEWED_PRODUCT';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent19(input: any): any {
  const name='SEARCHED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent20(input: any): any {
  const name='ADDED_TO_CART';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent21(input: any): any {
  const name='REMOVED_FROM_CART';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent22(input: any): any {
  const name='CHECKOUT_STARTED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent23(input: any): any {
  const name='CHECKOUT_COMPLETED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent24(input: any): any {
  const name='ORDER_VIEWED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent25(input: any): any {
  const name='SHIPMENT_VIEWED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent26(input: any): any {
  const name='RETURN_STARTED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent27(input: any): any {
  const name='RETURN_COMPLETED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent28(input: any): any {
  const name='REVIEW_VIEWED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent29(input: any): any {
  const name='REVIEW_SUBMITTED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent30(input: any): any {
  const name='SUPPORT_OPENED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent31(input: any): any {
  const name='SUPPORT_RESOLVED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent32(input: any): any {
  const name='PREFERENCE_CHANGED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent33(input: any): any {
  const name='WISHLIST_ADDED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent34(input: any): any {
  const name='WISHLIST_REMOVED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent35(input: any): any {
  const name='VIEWED_PRODUCT';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent36(input: any): any {
  const name='SEARCHED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent37(input: any): any {
  const name='ADDED_TO_CART';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent38(input: any): any {
  const name='REMOVED_FROM_CART';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent39(input: any): any {
  const name='CHECKOUT_STARTED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent40(input: any): any {
  const name='CHECKOUT_COMPLETED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent41(input: any): any {
  const name='ORDER_VIEWED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent42(input: any): any {
  const name='SHIPMENT_VIEWED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent43(input: any): any {
  const name='RETURN_STARTED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent44(input: any): any {
  const name='RETURN_COMPLETED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent45(input: any): any {
  const name='REVIEW_VIEWED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent46(input: any): any {
  const name='REVIEW_SUBMITTED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent47(input: any): any {
  const name='SUPPORT_OPENED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent48(input: any): any {
  const name='SUPPORT_RESOLVED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent49(input: any): any {
  const name='PREFERENCE_CHANGED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent50(input: any): any {
  const name='WISHLIST_ADDED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent51(input: any): any {
  const name='WISHLIST_REMOVED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent52(input: any): any {
  const name='VIEWED_PRODUCT';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent53(input: any): any {
  const name='SEARCHED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent54(input: any): any {
  const name='ADDED_TO_CART';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent55(input: any): any {
  const name='REMOVED_FROM_CART';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent56(input: any): any {
  const name='CHECKOUT_STARTED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent57(input: any): any {
  const name='CHECKOUT_COMPLETED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent58(input: any): any {
  const name='ORDER_VIEWED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent59(input: any): any {
  const name='SHIPMENT_VIEWED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent60(input: any): any {
  const name='RETURN_STARTED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent61(input: any): any {
  const name='RETURN_COMPLETED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent62(input: any): any {
  const name='REVIEW_VIEWED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent63(input: any): any {
  const name='REVIEW_SUBMITTED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent64(input: any): any {
  const name='SUPPORT_OPENED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent65(input: any): any {
  const name='SUPPORT_RESOLVED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent66(input: any): any {
  const name='PREFERENCE_CHANGED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent67(input: any): any {
  const name='WISHLIST_ADDED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent68(input: any): any {
  const name='WISHLIST_REMOVED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent69(input: any): any {
  const name='VIEWED_PRODUCT';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent70(input: any): any {
  const name='SEARCHED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent71(input: any): any {
  const name='ADDED_TO_CART';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent72(input: any): any {
  const name='REMOVED_FROM_CART';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent73(input: any): any {
  const name='CHECKOUT_STARTED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent74(input: any): any {
  const name='CHECKOUT_COMPLETED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent75(input: any): any {
  const name='ORDER_VIEWED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent76(input: any): any {
  const name='SHIPMENT_VIEWED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent77(input: any): any {
  const name='RETURN_STARTED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent78(input: any): any {
  const name='RETURN_COMPLETED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent79(input: any): any {
  const name='REVIEW_VIEWED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent80(input: any): any {
  const name='REVIEW_SUBMITTED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent81(input: any): any {
  const name='SUPPORT_OPENED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent82(input: any): any {
  const name='SUPPORT_RESOLVED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent83(input: any): any {
  const name='PREFERENCE_CHANGED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent84(input: any): any {
  const name='WISHLIST_ADDED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent85(input: any): any {
  const name='WISHLIST_REMOVED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent86(input: any): any {
  const name='VIEWED_PRODUCT';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent87(input: any): any {
  const name='SEARCHED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent88(input: any): any {
  const name='ADDED_TO_CART';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent89(input: any): any {
  const name='REMOVED_FROM_CART';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent90(input: any): any {
  const name='CHECKOUT_STARTED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent91(input: any): any {
  const name='CHECKOUT_COMPLETED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent92(input: any): any {
  const name='ORDER_VIEWED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent93(input: any): any {
  const name='SHIPMENT_VIEWED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent94(input: any): any {
  const name='RETURN_STARTED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent95(input: any): any {
  const name='RETURN_COMPLETED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent96(input: any): any {
  const name='REVIEW_VIEWED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent97(input: any): any {
  const name='REVIEW_SUBMITTED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent98(input: any): any {
  const name='SUPPORT_OPENED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent99(input: any): any {
  const name='SUPPORT_RESOLVED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent100(input: any): any {
  const name='PREFERENCE_CHANGED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent101(input: any): any {
  const name='WISHLIST_ADDED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}

export function normalizeEvent102(input: any): any {
  const name='WISHLIST_REMOVED';
  const entityType=String(input?.entityType??'').trim().slice(0,80)||null;
  const entityId=String(input?.entityId??'').trim().slice(0,120)||null;
  const properties=input?.properties&&typeof input.properties==='object'&&!Array.isArray(input.properties)?input.properties:{};
  return {name,entityType,entityId,properties};
}
