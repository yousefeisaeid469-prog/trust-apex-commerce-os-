import { SAVED_CART_MAX_ITEMS } from './contracts';

export function savedCartRule1(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule2(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule3(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule4(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule5(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule6(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule7(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule8(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule9(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule10(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule11(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule12(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule13(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule14(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule15(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule16(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule17(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule18(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule19(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule20(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule21(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule22(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule23(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule24(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule25(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule26(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule27(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule28(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule29(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule30(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule31(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule32(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule33(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule34(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule35(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule36(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule37(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule38(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule39(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule40(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule41(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule42(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule43(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule44(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule45(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule46(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule47(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule48(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule49(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule50(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule51(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule52(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule53(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule54(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule55(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule56(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule57(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule58(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule59(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule60(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule61(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule62(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule63(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule64(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule65(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule66(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule67(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule68(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule69(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule70(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule71(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule72(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule73(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule74(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule75(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule76(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule77(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule78(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=50;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule79(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}

export function savedCartRule80(input: any): any {
  const quantity=Math.floor(Number(input?.quantity??0));
  const unitPrice=Math.floor(Number(input?.unitPriceCents??0));
  const cap=100;
  const valid=quantity>0 && quantity<=cap && unitPrice>=0;
  return {valid,quantity:Math.min(Math.max(quantity,0),cap),subtotal:Math.max(quantity,0)*Math.max(unitPrice,0),cap};
}
