import { stableHash } from './helpers';

export function customerSignal1(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=10;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal2(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=15;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal3(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=20;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal4(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=25;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal5(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=30;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal6(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=35;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal7(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=5;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal8(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=10;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal9(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=15;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal10(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=20;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal11(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=25;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal12(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=30;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal13(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=35;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal14(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=5;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal15(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=10;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal16(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=15;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal17(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=20;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal18(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=25;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal19(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=30;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal20(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=35;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal21(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=5;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal22(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=10;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal23(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=15;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal24(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=20;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal25(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=25;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal26(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=30;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal27(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=35;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal28(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=5;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal29(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=10;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal30(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=15;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal31(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=20;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal32(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=25;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal33(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=30;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal34(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=35;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal35(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=5;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal36(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=10;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal37(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=15;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal38(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=20;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal39(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=25;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal40(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=30;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal41(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=35;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal42(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=5;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal43(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=10;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal44(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=15;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal45(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=20;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal46(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=25;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal47(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=30;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal48(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=35;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal49(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=5;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal50(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=10;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal51(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=15;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal52(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=20;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal53(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=25;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal54(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=30;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal55(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=35;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal56(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=5;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal57(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=10;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal58(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=15;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal59(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=20;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal60(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=25;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal61(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=30;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal62(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=35;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal63(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=5;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal64(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=10;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal65(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=15;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal66(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=20;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal67(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=25;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal68(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=30;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal69(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=35;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal70(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=5;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal71(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=10;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal72(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=15;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal73(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=20;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal74(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=25;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal75(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=30;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal76(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=35;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal77(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=5;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal78(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=10;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal79(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=15;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal80(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=20;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal81(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=25;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal82(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=30;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal83(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=35;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal84(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=5;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal85(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=10;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal86(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=15;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal87(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=20;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal88(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=25;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal89(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=30;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal90(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=35;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal91(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=5;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal92(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=10;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal93(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=15;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal94(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=20;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal95(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=25;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal96(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=30;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal97(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=35;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal98(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=5;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal99(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=10;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}

export function customerSignal100(input: any): any {
  const orders=Math.max(0,Number(input?.orderCount??0));
  const spend=Math.max(0,Number(input?.lifetimeValue??0));
  const returns=Math.max(0,Number(input?.returnedOrderCount??0));
  const support=Math.max(0,Number(input?.supportOpenCount??0));
  const weight=15;
  const raw=Math.min(100,orders*2+Math.log10(spend+1)*10-returns*8-support*5+weight);
  const score=Math.max(0,Math.round(raw));
  return {score,band:score>=80?'A':score>=60?'B':score>=40?'C':score>=20?'D':'E',signals:{orders,spend,returns,support,weight}};
}
