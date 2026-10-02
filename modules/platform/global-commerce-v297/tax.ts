export function calculateTax(amountMinor:bigint,rule:any){return {amountMinor:amountMinor*BigInt(rule.rateBps)/10000n,includedInPrice:Boolean(rule.includedInPrice),rateBps:rule.rateBps};}
