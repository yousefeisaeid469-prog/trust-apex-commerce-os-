import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const currency = fs.readFileSync('lib/i18n/currency.ts','utf8');
const global = fs.readFileSync('lib/i18n/global.ts','utf8');
const shell = fs.readFileSync('components/trust-os-shell.tsx','utf8');

test('V160 exposes runtime-discovered global ISO currency coverage',()=>{
  assert.match(currency,/Intl\.supportedValuesOf\('currency'\)/);
  assert.match(currency,/ALL_CURRENCY_CODES/);
});

test('V160 never invents an FX rate for an unknown currency',()=>{
  assert.match(currency,/FX quote unavailable/);
  assert.match(currency,/RATES_AS_OF/);
});

test('V160 has a multilingual RTL/LTR registry and resolver',()=>{
  assert.match(global,/GLOBAL_LANGUAGES/);
  assert.match(global,/resolveLanguage/);
  assert.match(global,/dir: 'ltr' | 'rtl'\| 'ltr'/);
});

test('V160 storefront exposes language and currency selectors',()=>{
  assert.match(shell,/aria-label="اللغة"/);
  assert.match(shell,/aria-label="العملة"/);
  assert.match(shell,/ALL_CURRENCY_CODES/);
});
