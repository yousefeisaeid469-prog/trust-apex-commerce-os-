export type RevenueStream='commission'|'ads'|'sponsored'|'affiliate'|'subscription'|'sponsorship';
export type MonetizationEvent={stream:RevenueStream;amount:number;currency:'EGP';sourceId:string};
