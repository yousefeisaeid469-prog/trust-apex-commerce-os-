export type SharedCartMember={id:string;displayName:string};
export type SharedCart={id:string;members:SharedCartMember[];productIds:string[];status:'active'|'checked_out'};
