export type PaymentAdapterDescriptor={id:string;provider:string;sandbox:boolean;capability:'CARD'|'COD'|'WALLET'|'BANK_TRANSFER';countries:string[];currencies:string[]};
export const adapters:PaymentAdapterDescriptor[]=[
 {id:'trust-card-eg',provider:'TRUST_CARD_ADAPTER',sandbox:false,capability:'CARD',countries:['EG'],currencies:['EGP']},
 {id:'trust-cod-eg',provider:'TRUST_COD_ADAPTER',sandbox:false,capability:'COD',countries:['EG'],currencies:['EGP']},
 {id:'trust-wallet-eg',provider:'TRUST_WALLET_ADAPTER',sandbox:false,capability:'WALLET',countries:['EG'],currencies:['EGP']},
];
export function paymentAdapters(country:string,currency:string){const c=country.trim().toUpperCase(),cur=currency.trim().toUpperCase();return adapters.filter(a=>a.countries.includes(c)&&a.currencies.includes(cur));}
