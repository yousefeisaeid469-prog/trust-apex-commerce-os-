import {acceptDurableOrchestration} from '../modules/platform/autonomous-commerce-orchestrator/durable.ts';
const event={eventId:`cli-${Date.now()}`,tenantId:'demo',type:'PRICE_CHANGED',aggregateId:'product-demo',sequence:1,occurredAt:Date.now(),payload:{price:100}};
try { console.log(JSON.stringify(await acceptDurableOrchestration(event),null,2)); } catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode=1; }
