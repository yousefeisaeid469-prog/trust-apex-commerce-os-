export type CustomerLifecycle = 'ACTIVE' | 'SUSPENDED' | 'DELETED' | 'PENDING_DELETION';
export type AddressKind = 'SHIPPING' | 'BILLING';
export type WishlistVisibility = 'PRIVATE' | 'SHARED';
export type SavedCartStatus = 'ACTIVE' | 'CHECKED_OUT' | 'ABANDONED' | 'EXPIRED';
export type ReviewStatus = 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'REMOVED';
export type ReviewSource = 'VERIFIED_PURCHASE' | 'CUSTOMER_SUBMITTED' | 'IMPORT';
export type PreferenceScope = 'MARKETING' | 'TRANSACTIONAL' | 'PERSONALIZATION' | 'ANALYTICS';
export type PrivacyJobType = 'EXPORT' | 'DELETE';
export type PrivacyJobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type TimelineKind = 'ORDER' | 'PAYMENT' | 'SHIPMENT' | 'RETURN' | 'SUPPORT' | 'PROFILE' | 'SECURITY' | 'REVIEW' | 'CREDIT';

export interface CustomerProfile { id:string; email:string; displayName:string|null; phone:string|null; locale:string; timezone:string; lifecycle:CustomerLifecycle; marketingOptIn:boolean; personalizationOptIn:boolean; createdAt:string; updatedAt:string; }
export interface CustomerAddress { id:string; customerId:string; kind:AddressKind; label:string; recipientName:string; line1:string; line2:string|null; city:string; region:string|null; postalCode:string|null; countryCode:string; phone:string|null; isDefault:boolean; createdAt:string; updatedAt:string; }
export interface Wishlist { id:string; customerId:string; name:string; visibility:WishlistVisibility; createdAt:string; updatedAt:string; }
export interface WishlistItem { id:string; wishlistId:string; productId:string; variantId:string|null; note:string|null; priority:number; addedAt:string; }
export interface SavedCart { id:string; customerId:string; name:string; status:SavedCartStatus; currency:string; createdAt:string; updatedAt:string; expiresAt:string|null; }
export interface SavedCartItem { id:string; savedCartId:string; productId:string; variantId:string|null; quantity:number; unitPriceCents:number; currency:string; addedAt:string; }
export interface CustomerReview { id:string; customerId:string; productId:string; orderId:string|null; rating:number; title:string|null; body:string; status:ReviewStatus; source:ReviewSource; verifiedPurchase:boolean; moderationReason:string|null; createdAt:string; updatedAt:string; }
export interface CustomerPreference { customerId:string; scope:PreferenceScope; key:string; enabled:boolean; value:string|null; updatedAt:string; }
export interface PrivacyJob { id:string; customerId:string; type:PrivacyJobType; status:PrivacyJobStatus; requestedAt:string; startedAt:string|null; completedAt:string|null; errorCode:string|null; artifactKey:string|null; }
export interface TimelineEvent { id:string; customerId:string; kind:TimelineKind; entityType:string; entityId:string; action:string; summary:string; occurredAt:string; metadata:Record<string,unknown>; }
export interface CustomerDashboard { profile:CustomerProfile; addresses:CustomerAddress[]; wishlists:Array<Wishlist & {itemCount:number}>; savedCarts:Array<SavedCart & {itemCount:number}>; reviews:CustomerReview[]; preferences:CustomerPreference[]; timeline:TimelineEvent[]; privacyJobs:PrivacyJob[]; }

export const CUSTOMER_PREFERENCE_KEYS: Record<PreferenceScope,string[]> = {
  MARKETING:['email','sms','whatsapp','push'],
  TRANSACTIONAL:['email','sms','whatsapp','push'],
  PERSONALIZATION:['recommendations','recently_viewed','price_alerts'],
  ANALYTICS:['product_analytics','service_analytics'],
};
export const REVIEW_RATING_MIN=1;
export const REVIEW_RATING_MAX=5;
export const SAVED_CART_MAX_ITEMS=100;
export const WISHLIST_MAX_ITEMS=500;
export const ADDRESS_MAX_PER_CUSTOMER=20;
