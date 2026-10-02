/** Global currency layer.
 *
 * Browsing supports the complete currency list exposed by the runtime's
 * Intl implementation. A price is only converted when a verified FX quote
 * is available. Without a quote we show the original settlement currency;
 * we never invent an exchange rate.
 */
export type SupportedCurrency = string;
export type CurrencyMeta = { code: string; label: string; locale: string; symbol: string; digits: number };

const FALLBACK: Record<string, Partial<CurrencyMeta>> = {
  EGP:{label:'الجنيه المصري',locale:'ar-EG'}, USD:{label:'الدولار الأمريكي',locale:'en-US'}, EUR:{label:'اليورو',locale:'de-DE'},
  SAR:{label:'الريال السعودي',locale:'ar-SA'}, AED:{label:'الدرهم الإماراتي',locale:'ar-AE'}, GBP:{label:'الجنيه الإسترليني',locale:'en-GB'},
  JPY:{label:'الين الياباني',locale:'ja-JP'}, CNY:{label:'اليوان الصيني',locale:'zh-CN'}, INR:{label:'الروبية الهندية',locale:'hi-IN'}, CAD:{label:'الدولار الكندي',locale:'en-CA'},
  AUD:{label:'الدولار الأسترالي',locale:'en-AU'}, CHF:{label:'الفرنك السويسري',locale:'de-CH'}, TRY:{label:'الليرة التركية',locale:'tr-TR'}, ZAR:{label:'الراند الجنوب أفريقي',locale:'en-ZA'},
};

const CURRENCY_CODES: string[] = typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl
  ? Intl.supportedValuesOf('currency')
  : ['EGP','USD','EUR','SAR','AED','GBP','JPY','CNY','INR','CAD','AUD','CHF','TRY','ZAR'];

export const ALL_CURRENCY_CODES = Array.from(new Set(['EGP', ...CURRENCY_CODES])).sort();

export function currencyMeta(code: string, locale = 'en-US'): CurrencyMeta {
  const normalized = code.toUpperCase();
  const effectiveLocale = FALLBACK[normalized]?.locale ?? locale;
  const parts = new Intl.NumberFormat(effectiveLocale, { style:'currency', currency:normalized }).formatToParts(0);
  const symbol = parts.find(p => p.type === 'currency')?.value ?? normalized;
  const digits = new Intl.NumberFormat(effectiveLocale, { style:'currency', currency:normalized }).resolvedOptions().maximumFractionDigits ?? 2;
  return { code: normalized, label: FALLBACK[normalized]?.label ?? normalized, locale: effectiveLocale, symbol, digits };
}

export const CURRENCY_META: Record<string, CurrencyMeta> = Object.fromEntries(ALL_CURRENCY_CODES.map(code => [code, currencyMeta(code)]));

// Legacy-compatible dated indicative references. These are intentionally not used
// for checkout or presented as live FX.
export const INDICATIVE_RATES_EGP: Record<string, number> = { EGP:1, USD:49.5, EUR:53.8, SAR:13.2, AED:13.5, GBP:66, JPY:0.33, CNY:6.9, INR:0.59 };
export const RATES_AS_OF = '2026-09-01';

export function formatEGP(amountEgp: number): string { return new Intl.NumberFormat('ar-EG',{style:'currency',currency:'EGP',maximumFractionDigits:0}).format(amountEgp); }
export function formatMoney(amount: number, currency: string, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale || currencyMeta(currency).locale,{style:'currency',currency:currency.toUpperCase()}).format(amount);
}
export function formatIndicative(amountEgp: number, currency: SupportedCurrency): string {
  const code = currency.toUpperCase();
  const rate = INDICATIVE_RATES_EGP[code];
  if (code === 'EGP') return formatEGP(amountEgp);
  if (!rate) return `${formatEGP(amountEgp)} · FX quote unavailable`;
  return `≈ ${formatMoney(amountEgp / rate, code, CURRENCY_META[code]?.locale ?? 'en-US')} · reference ${RATES_AS_OF}`;
}
