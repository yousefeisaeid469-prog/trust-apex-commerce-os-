export type IntelligenceProduct = {
  id:string; name:string; category:string; price:number; oldPrice?:number; merchant:string;
  rating:number; stock:number; region:string; tags:string[]; image?:string;
};
export type MarketplaceContext = {
  q?:string; category?:string; region?:string; maxPrice?:number; minRating?:number;
  preferredTags?:string[]; inStock?:boolean;
};
export type RankedOffer = IntelligenceProduct & {
  score:number; match:number; value:number; trust:number; availability:number; reasons:string[];
};
export type MarketplaceInsight = {
  id:string; priority:number; title:string; reason:string; evidence:string[];
  action:string; monetizable:boolean; guardrail:string;
};
export type MarketplaceIntelligenceSnapshot = {
  version:'V206'; total:number; query:string; mode:'discovery'|'search'|'category';
  offers:RankedOffer[]; categories:string[]; regions:string[];
  insights:MarketplaceInsight[];
};
