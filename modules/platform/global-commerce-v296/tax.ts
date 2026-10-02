export function calculateTax(amountMinor:bigint,rateBps:number){return amountMinor*BigInt(rateBps)/10000n;}
