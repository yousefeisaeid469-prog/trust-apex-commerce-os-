import { normalizeText } from './helpers';

export function rankCustomerSearch1(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=1;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch2(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=2;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch3(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=3;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch4(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=4;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch5(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=5;
  const stock=0;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch6(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=6;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch7(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=7;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch8(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=8;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch9(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=9;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch10(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=10;
  const stock=0;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch11(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=11;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch12(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=12;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch13(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=13;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch14(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=14;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch15(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=15;
  const stock=0;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch16(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=16;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch17(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=17;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch18(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=18;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch19(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=19;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch20(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=20;
  const stock=0;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch21(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=21;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch22(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=22;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch23(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=23;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch24(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=24;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch25(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=25;
  const stock=0;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch26(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=26;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch27(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=27;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch28(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=28;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch29(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=29;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch30(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=0;
  const stock=0;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch31(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=1;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch32(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=2;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch33(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=3;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch34(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=4;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch35(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=5;
  const stock=0;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch36(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=6;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch37(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=7;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch38(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=8;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch39(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=9;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch40(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=10;
  const stock=0;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch41(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=11;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch42(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=12;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch43(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=13;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch44(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=14;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch45(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=15;
  const stock=0;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch46(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=16;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch47(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=17;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch48(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=18;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch49(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=19;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch50(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=20;
  const stock=0;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch51(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=21;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch52(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=22;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch53(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=23;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch54(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=24;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch55(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=25;
  const stock=0;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch56(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=26;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch57(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=27;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch58(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=28;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch59(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=29;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch60(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=0;
  const stock=0;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch61(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=1;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch62(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=2;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch63(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=3;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch64(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=4;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch65(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=5;
  const stock=0;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch66(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=6;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch67(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=7;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch68(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=8;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch69(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=9;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch70(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=10;
  const stock=0;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch71(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=11;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch72(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=12;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch73(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=13;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch74(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=14;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch75(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=15;
  const stock=0;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch76(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=16;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch77(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=17;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch78(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=18;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch79(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=19;
  const stock=1;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}

export function rankCustomerSearch80(input: any): any {
  const text=String(input?.text??'').toLowerCase();
  const email=String(input?.email??'').toLowerCase();
  const name=String(input?.displayName??'').toLowerCase();
  const freshness=20;
  const stock=0;
  const exact=email===text||name===text;
  const starts=email.startsWith(text)||name.startsWith(text);
  const contains=email.includes(text)||name.includes(text);
  const score=(exact?100:0)+(starts?60:0)+(contains?30:0)+freshness+stock*5;
  return {score,match:exact?'EXACT':starts?'PREFIX':contains?'CONTAINS':'NONE'};
}
