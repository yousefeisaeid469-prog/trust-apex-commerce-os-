import { normalizeCountry, normalizeText } from './helpers';

export function isSupportedCountryEG(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'EG';
}

export function isSupportedCountryUS(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'US';
}

export function isSupportedCountryGB(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'GB';
}

export function isSupportedCountryAE(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'AE';
}

export function isSupportedCountrySA(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'SA';
}

export function isSupportedCountryDE(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'DE';
}

export function isSupportedCountryFR(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'FR';
}

export function isSupportedCountryIT(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'IT';
}

export function isSupportedCountryES(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'ES';
}

export function isSupportedCountryCA(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'CA';
}

export function isSupportedCountryAU(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'AU';
}

export function isSupportedCountryJP(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'JP';
}

export function isSupportedCountryIN(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'IN';
}

export function isSupportedCountryBR(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'BR';
}

export function isSupportedCountryTR(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'TR';
}

export function isSupportedCountryNL(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'NL';
}

export function isSupportedCountrySE(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'SE';
}

export function isSupportedCountryNO(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'NO';
}

export function isSupportedCountryDK(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'DK';
}

export function isSupportedCountryCH(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'CH';
}

export function isSupportedCountryAT(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'AT';
}

export function isSupportedCountryBE(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'BE';
}

export function isSupportedCountryGR(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'GR';
}

export function isSupportedCountryPT(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'PT';
}

export function isSupportedCountryPL(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'PL';
}

export function isSupportedCountryCZ(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'CZ';
}

export function isSupportedCountryZA(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'ZA';
}

export function isSupportedCountryNG(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'NG';
}

export function isSupportedCountryKE(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'KE';
}

export function isSupportedCountryMA(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'MA';
}

export function isSupportedCountryTN(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'TN';
}

export function isSupportedCountryJO(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'JO';
}

export function isSupportedCountryQA(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'QA';
}

export function isSupportedCountryKW(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'KW';
}

export function isSupportedCountryBH(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'BH';
}

export function isSupportedCountryOM(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'OM';
}

export function isSupportedCountryIL(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'IL';
}

export function isSupportedCountryMX(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'MX';
}

export function isSupportedCountryAR(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'AR';
}

export function isSupportedCountryCL(input: any): any {
  return String(input?.countryCode ?? '').toUpperCase() === 'CL';
}

export function hasAddressRecipientName(input: any): any {
  const value=String(input?.recipientName ?? '').trim();
  return value.length > 0 && value.length <= 240;
}

export function hasAddressLine1(input: any): any {
  const value=String(input?.line1 ?? '').trim();
  return value.length > 0 && value.length <= 240;
}

export function hasAddressCity(input: any): any {
  const value=String(input?.city ?? '').trim();
  return value.length > 0 && value.length <= 120;
}

export function hasAddressCountryCode(input: any): any {
  const value=String(input?.countryCode ?? '').trim();
  return value.length > 0 && value.length <= 2;
}

export function hasAddressPostalCode(input: any): any {
  const value=String(input?.postalCode ?? '').trim();
  return value.length > 0 && value.length <= 120;
}

export function hasAddressPhone(input: any): any {
  const value=String(input?.phone ?? '').trim();
  return value.length > 0 && value.length <= 120;
}

export function hasAddressLabel(input: any): any {
  const value=String(input?.label ?? '').trim();
  return value.length > 0 && value.length <= 120;
}

export function hasAddressRegion(input: any): any {
  const value=String(input?.region ?? '').trim();
  return value.length > 0 && value.length <= 120;
}

export function normalizeAddressLine1(input: any): any {
  return String(input?.line1 ?? '').trim().replace(/[\u0000-\u001f]/g,'').slice(0,240);
}

export function normalizeAddressLine2(input: any): any {
  return String(input?.line2 ?? '').trim().replace(/[\u0000-\u001f]/g,'').slice(0,240);
}

export function normalizeAddressCity(input: any): any {
  return String(input?.city ?? '').trim().replace(/[\u0000-\u001f]/g,'').slice(0,120);
}

export function normalizeAddressRegion(input: any): any {
  return String(input?.region ?? '').trim().replace(/[\u0000-\u001f]/g,'').slice(0,120);
}

export function normalizeAddressPostalCode(input: any): any {
  return String(input?.postalCode ?? '').trim().replace(/[\u0000-\u001f]/g,'').slice(0,40);
}

export function normalizeAddressPhone(input: any): any {
  return String(input?.phone ?? '').trim().replace(/[\u0000-\u001f]/g,'').slice(0,40);
}

export function normalizeAddressLabel(input: any): any {
  return String(input?.label ?? '').trim().replace(/[\u0000-\u001f]/g,'').slice(0,80);
}

export function normalizeAddressRecipientName(input: any): any {
  return String(input?.recipientName ?? '').trim().replace(/[\u0000-\u001f]/g,'').slice(0,160);
}

export function addressCompletenessRule1(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule2(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule3(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule4(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 3;
}

export function addressCompletenessRule5(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule6(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule7(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule8(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 3;
}

export function addressCompletenessRule9(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule10(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule11(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule12(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 3;
}

export function addressCompletenessRule13(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule14(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule15(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule16(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 3;
}

export function addressCompletenessRule17(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule18(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule19(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule20(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 3;
}

export function addressCompletenessRule21(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule22(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule23(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule24(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 3;
}

export function addressCompletenessRule25(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule26(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule27(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule28(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 3;
}

export function addressCompletenessRule29(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule30(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule31(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule32(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 3;
}

export function addressCompletenessRule33(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule34(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule35(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule36(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 3;
}

export function addressCompletenessRule37(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule38(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule39(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 4;
}

export function addressCompletenessRule40(input: any): any {
  const fields=['recipientName','line1','city','countryCode'];
  const present=fields.filter(k=>String(input?.[k]??'').trim()).length;
  return present >= 3;
}
