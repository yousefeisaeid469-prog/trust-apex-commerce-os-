import assert from 'node:assert/strict';
import http from 'node:http';

process.env.PAYMENT_PROVIDER='contract-test';
process.env.PAYMENT_CONTRACT_TEST_SECRET='secret';
process.env.PAYMENT_CONTRACT_TEST_BASE_URL='http://127.0.0.1:0';
process.env.TRUST_ENVIRONMENT='sandbox';

const { createHttpPaymentAdapter } = await import('../modules/platform/payment-providers/http-adapter.ts');
const requests=[];
const server=http.createServer(async (req,res)=>{
  let body=''; for await (const chunk of req) body+=chunk;
  requests.push({method:req.method,url:req.url,headers:req.headers,body:body?JSON.parse(body):null});
  res.setHeader('content-type','application/json');
  if(req.url==='/payments'){res.end(JSON.stringify({id:'prov_pay_123',status:'captured',clientSecret:'cs_test'}));return;}
  if(req.url==='/refunds'){res.end(JSON.stringify({providerReference:'prov_ref_456',status:'succeeded'}));return;}
  res.statusCode=404; res.end('{}');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
const adapter=createHttpPaymentAdapter('contract-test','SANDBOX',{baseUrl:`http://127.0.0.1:${port}`,secret:'secret'});
const payment=await adapter.createPayment({paymentId:'pay_1',orderId:'ord_1',amount:125,currency:'EGP',customerId:'cus_1',idempotencyKey:'payment:key-1'});
assert.equal(payment.providerReference,'prov_pay_123');
assert.equal(payment.status,'captured');
assert.equal(payment.clientSecret,'cs_test');
const refund=await adapter.refund({refundId:'ref_1',providerReference:'prov_pay_123',amount:25,currency:'EGP',reason:'test',idempotencyKey:'refund:key-1'});
assert.equal(refund.providerReference,'prov_ref_456');
assert.equal(refund.status,'succeeded');
assert.equal(requests.length,2);
assert.equal(requests[0].headers.authorization,'Bearer secret');
assert.equal(requests[0].headers['idempotency-key'],'payment:key-1');
assert.equal(requests[1].headers['idempotency-key'],'refund:key-1');
assert.equal(requests[0].body.amount,125);
assert.equal(requests[1].body.providerReference,'prov_pay_123');
await new Promise(resolve=>server.close(resolve));
console.log('V240 provider contract test PASS');
