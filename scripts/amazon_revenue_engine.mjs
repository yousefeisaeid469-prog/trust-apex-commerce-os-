import {AMAZON_REVENUE_PROGRAMS,quoteRevenueCharge} from '../modules/platform/amazon-revenue-os/core.ts';
const q=quoteRevenueCharge({programId:'marketplace-commission',sourceId:'demo-order',occurredAt:new Date().toISOString(),meter:{programId:'marketplace-commission',baseMinor:10000n,rateBps:1500},evidenceType:'ORDER',evidenceId:'demo-order',idempotencyKey:'demo'});
console.log(JSON.stringify({version:'V216.0.0',programs:AMAZON_REVENUE_PROGRAMS.length,exampleQuoteMinor:q.amountMinor.toString(),financialSideEffect:false}));
