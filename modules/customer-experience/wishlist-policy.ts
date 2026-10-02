import { WISHLIST_MAX_ITEMS } from './contracts';

export function wishlistRule1(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='REMOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule2(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='MOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule3(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='PRIORITIZE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule4(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='ADD';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule5(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='REMOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule6(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='MOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule7(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='PRIORITIZE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule8(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='ADD';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule9(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='REMOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule10(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='MOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule11(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='PRIORITIZE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule12(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='ADD';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule13(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='REMOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule14(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='MOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule15(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='PRIORITIZE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule16(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='ADD';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule17(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='REMOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule18(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='MOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule19(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='PRIORITIZE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule20(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='ADD';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule21(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='REMOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule22(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='MOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule23(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='PRIORITIZE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule24(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='ADD';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule25(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='REMOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule26(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='MOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule27(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='PRIORITIZE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule28(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='ADD';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule29(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='REMOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule30(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='MOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule31(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='PRIORITIZE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule32(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='ADD';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule33(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='REMOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule34(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='MOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule35(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='PRIORITIZE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule36(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='ADD';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule37(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='REMOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule38(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='MOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule39(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='PRIORITIZE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule40(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='ADD';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule41(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='REMOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule42(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='MOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule43(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='PRIORITIZE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule44(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='ADD';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule45(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='REMOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule46(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='MOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule47(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='PRIORITIZE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule48(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='ADD';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule49(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='REMOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule50(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='MOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule51(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='PRIORITIZE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule52(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='ADD';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule53(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='REMOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule54(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='MOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule55(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='PRIORITIZE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule56(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='ADD';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule57(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='REMOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule58(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='MOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule59(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='PRIORITIZE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule60(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='ADD';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule61(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='REMOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule62(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='MOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule63(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='PRIORITIZE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule64(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='ADD';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule65(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='REMOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule66(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='MOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule67(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='PRIORITIZE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule68(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='ADD';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule69(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='REMOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule70(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='MOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule71(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='PRIORITIZE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule72(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='ADD';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule73(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='REMOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule74(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='MOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule75(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='PRIORITIZE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule76(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='ADD';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule77(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='REMOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule78(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='MOVE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule79(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='PRIORITIZE';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}

export function wishlistRule80(input: any): any {
  const priority=Number(input?.priority??1);
  const itemCount=Number(input?.itemCount??0);
  const action='ADD';
  return {allowed:itemCount < 500 && priority>=1 && priority<=100 && Boolean(input?.productId),action,reason:itemCount>=500?'LIMIT':'OK'};
}
