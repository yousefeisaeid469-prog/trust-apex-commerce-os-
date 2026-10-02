import assert from 'node:assert/strict';
import { validateJsonSchema } from '../modules/platform/commerce-events/schema-validator.ts';

const schema = {
  type: 'object',
  required: ['orderId', 'total'],
  properties: {
    orderId: { type: 'string' },
    total: { type: 'number' },
    lines: { type: 'array', items: { type: 'object', required: ['sku'], properties: { sku: { type: 'string' } }, additionalProperties: false } },
  },
  additionalProperties: false,
};
assert.equal(validateJsonSchema({orderId:'o-1', total:10, lines:[{sku:'sku-1'}]}, schema), undefined);
assert.match(validateJsonSchema({total:10}, schema), /REQUIRED/);
assert.match(validateJsonSchema({orderId:'o-1', total:'10'}, schema), /TYPE_number/);
assert.match(validateJsonSchema({orderId:'o-1', total:10, extra:true}, schema), /ADDITIONAL_PROPERTY/);
assert.match(validateJsonSchema({orderId:'o-1', total:10, lines:[{sku:3}]}, schema), /TYPE_string/);
console.log('V247 schema contract test: PASS');
