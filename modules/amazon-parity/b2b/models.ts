export type BusinessAccount = { id:string; legalName:string; taxId?:string; approvalStatus:'pending'|'approved'|'rejected'; paymentTerms:'prepaid'|'net15'|'net30'; };
export type QuantityPrice = { minQty:number; unitPriceCents:number };
