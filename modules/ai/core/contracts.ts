export type AIRecommendation={productId:string;reason:string;confidence:number};
export type AIServiceName='pricing'|'stylist'|'fit'|'forecasting'|'visual-search'|'voice';
export type AIRequest={service:AIServiceName;input:Record<string,unknown>};
