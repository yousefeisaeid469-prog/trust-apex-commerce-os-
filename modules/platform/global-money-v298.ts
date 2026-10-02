export function minorToMajor(minor:bigint,currency:string):number{
  const zeroDecimal=new Set(['JPY','KRW']);
  const divisor=zeroDecimal.has(currency.toUpperCase())?1n:100n;
  const sign=minor<0n?-1:1;
  const abs=minor<0n?-minor:minor;
  const whole=abs/divisor;
  const frac=abs%divisor;
  return Number((sign*(Number(whole)+Number(frac)/Number(divisor))).toFixed(2));
}
