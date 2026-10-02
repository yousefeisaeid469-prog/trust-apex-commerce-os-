import { resolveConsent } from './consent';

export function validateJourneyStep1(input: any): any {
  const channel='SMS';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep2(input: any): any {
  const channel='WHATSAPP';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep3(input: any): any {
  const channel='PUSH';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep4(input: any): any {
  const channel='IN_APP';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep5(input: any): any {
  const channel='EMAIL';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep6(input: any): any {
  const channel='SMS';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep7(input: any): any {
  const channel='WHATSAPP';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep8(input: any): any {
  const channel='PUSH';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep9(input: any): any {
  const channel='IN_APP';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep10(input: any): any {
  const channel='EMAIL';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep11(input: any): any {
  const channel='SMS';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep12(input: any): any {
  const channel='WHATSAPP';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep13(input: any): any {
  const channel='PUSH';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep14(input: any): any {
  const channel='IN_APP';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep15(input: any): any {
  const channel='EMAIL';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep16(input: any): any {
  const channel='SMS';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep17(input: any): any {
  const channel='WHATSAPP';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep18(input: any): any {
  const channel='PUSH';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep19(input: any): any {
  const channel='IN_APP';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep20(input: any): any {
  const channel='EMAIL';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep21(input: any): any {
  const channel='SMS';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep22(input: any): any {
  const channel='WHATSAPP';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep23(input: any): any {
  const channel='PUSH';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep24(input: any): any {
  const channel='IN_APP';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep25(input: any): any {
  const channel='EMAIL';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep26(input: any): any {
  const channel='SMS';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep27(input: any): any {
  const channel='WHATSAPP';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep28(input: any): any {
  const channel='PUSH';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep29(input: any): any {
  const channel='IN_APP';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep30(input: any): any {
  const channel='EMAIL';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep31(input: any): any {
  const channel='SMS';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep32(input: any): any {
  const channel='WHATSAPP';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep33(input: any): any {
  const channel='PUSH';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep34(input: any): any {
  const channel='IN_APP';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep35(input: any): any {
  const channel='EMAIL';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep36(input: any): any {
  const channel='SMS';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep37(input: any): any {
  const channel='WHATSAPP';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep38(input: any): any {
  const channel='PUSH';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep39(input: any): any {
  const channel='IN_APP';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep40(input: any): any {
  const channel='EMAIL';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep41(input: any): any {
  const channel='SMS';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep42(input: any): any {
  const channel='WHATSAPP';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep43(input: any): any {
  const channel='PUSH';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep44(input: any): any {
  const channel='IN_APP';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep45(input: any): any {
  const channel='EMAIL';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep46(input: any): any {
  const channel='SMS';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep47(input: any): any {
  const channel='WHATSAPP';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep48(input: any): any {
  const channel='PUSH';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep49(input: any): any {
  const channel='IN_APP';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep50(input: any): any {
  const channel='EMAIL';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep51(input: any): any {
  const channel='SMS';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep52(input: any): any {
  const channel='WHATSAPP';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep53(input: any): any {
  const channel='PUSH';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep54(input: any): any {
  const channel='IN_APP';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep55(input: any): any {
  const channel='EMAIL';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep56(input: any): any {
  const channel='SMS';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep57(input: any): any {
  const channel='WHATSAPP';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep58(input: any): any {
  const channel='PUSH';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep59(input: any): any {
  const channel='IN_APP';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep60(input: any): any {
  const channel='EMAIL';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep61(input: any): any {
  const channel='SMS';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep62(input: any): any {
  const channel='WHATSAPP';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep63(input: any): any {
  const channel='PUSH';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep64(input: any): any {
  const channel='IN_APP';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep65(input: any): any {
  const channel='EMAIL';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep66(input: any): any {
  const channel='SMS';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep67(input: any): any {
  const channel='WHATSAPP';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep68(input: any): any {
  const channel='PUSH';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep69(input: any): any {
  const channel='IN_APP';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep70(input: any): any {
  const channel='EMAIL';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep71(input: any): any {
  const channel='SMS';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep72(input: any): any {
  const channel='WHATSAPP';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep73(input: any): any {
  const channel='PUSH';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep74(input: any): any {
  const channel='IN_APP';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep75(input: any): any {
  const channel='EMAIL';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep76(input: any): any {
  const channel='SMS';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep77(input: any): any {
  const channel='WHATSAPP';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep78(input: any): any {
  const channel='PUSH';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep79(input: any): any {
  const channel='IN_APP';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep80(input: any): any {
  const channel='EMAIL';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep81(input: any): any {
  const channel='SMS';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep82(input: any): any {
  const channel='WHATSAPP';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep83(input: any): any {
  const channel='PUSH';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep84(input: any): any {
  const channel='IN_APP';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep85(input: any): any {
  const channel='EMAIL';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep86(input: any): any {
  const channel='SMS';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep87(input: any): any {
  const channel='WHATSAPP';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep88(input: any): any {
  const channel='PUSH';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep89(input: any): any {
  const channel='IN_APP';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep90(input: any): any {
  const channel='EMAIL';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep91(input: any): any {
  const channel='SMS';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep92(input: any): any {
  const channel='WHATSAPP';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep93(input: any): any {
  const channel='PUSH';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep94(input: any): any {
  const channel='IN_APP';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep95(input: any): any {
  const channel='EMAIL';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep96(input: any): any {
  const channel='SMS';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep97(input: any): any {
  const channel='WHATSAPP';
  const kind='TASK';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep98(input: any): any {
  const channel='PUSH';
  const kind='WAIT';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep99(input: any): any {
  const channel='IN_APP';
  const kind='TAG';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}

export function validateJourneyStep100(input: any): any {
  const channel='EMAIL';
  const kind='NOTIFY';
  const delay=Math.max(0,Math.floor(Number(input?.delayMinutes??0)));
  const template=String(input?.templateKey??'').trim().slice(0,120);
  const notifyValid=kind!=='NOTIFY'||template.length>0;
  const delayValid=delay<=10080;
  return {valid:notifyValid&&delayValid,channel,kind,delayMinutes:delay,templateKey:template};
}
