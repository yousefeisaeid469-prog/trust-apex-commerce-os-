export type SellerProduct = { id:string; name:string; category:string; price:number; stock:number; region:string; tags:string[]; image:string };
export type SellerOrder = { id:string; total:number; status:string; createdAt:string; items:Array<{productId:string;qty:number}> };
export type SellerSnapshot = { products:SellerProduct[]; orders:SellerOrder[]; verificationStatus?:string };
export type SellerOpportunity = { id:string; title:string; priority:number; impact:'HIGH'|'MEDIUM'|'LOW'; reason:string; action:string; monetizable:boolean; evidence:string[] };
export type ListingAudit = { productId:string; score:number; missing:string[]; strengths:string[]; titleSuggestion:string; descriptionPrompt:string };
export type RestockSignal = { productId:string; productName:string; stock:number; urgency:number; action:string };
export type SellerSuperBrief = {
  healthScore:number; availability:number; fulfillment:number; catalog:number; stockUnits:number; orders:number; revenue:number; aov:number;
  lowStock:number; outOfStock:number; processing:number; shipped:number; opportunities:SellerOpportunity[]; restock:RestockSignal[]; listings:ListingAudit[];
};
