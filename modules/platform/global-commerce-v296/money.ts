export function money(amountMinor:bigint|number,currency:string){return {amountMinor:BigInt(amountMinor),currency};}
export function assertCurrency(a:any,b:any){if(a.currency!==b.currency)throw new Error('CURRENCY_MISMATCH');}
