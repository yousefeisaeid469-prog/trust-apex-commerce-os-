export type CapabilityState = 'LIVE' | 'PROVIDER_REQUIRED' | 'FOUNDATION' | 'DISABLED' | 'DEGRADED';
export type Capability = { id:string; domain:string; name:string; state:CapabilityState; provider?:string; requiresEnv?:string[]; evidence:string[] };

const capabilities: Capability[] = [
  { id:'commerce.catalog', domain:'commerce', name:'Catalog reads', state:'LIVE', evidence:['PostgreSQL catalog repository'] },
  { id:'commerce.cart', domain:'commerce', name:'Cart persistence', state:'LIVE', evidence:['PostgreSQL cart store','transactional writes'] },
  { id:'commerce.orders', domain:'commerce', name:'Order reads', state:'LIVE', evidence:['PostgreSQL order repository'] },
  { id:'payments.intent', domain:'payments', name:'Payment intent orchestration', state:'LIVE', evidence:['durable payment intent','idempotent commands'] },
  { id:'payments.capture', domain:'payments', name:'Provider capture', state:'PROVIDER_REQUIRED', provider:'payment processor', requiresEnv:['PAYMENTS_PROVIDER_SECRET'], evidence:['adapter boundary exists'] },
  { id:'payments.webhooks', domain:'payments', name:'Webhook ingestion', state:'LIVE', evidence:['durable webhook inbox','deduplication'] },
  { id:'notifications.delivery', domain:'notifications', name:'External delivery', state:'PROVIDER_REQUIRED', provider:'email/sms/push provider', evidence:['durable notification queue'] },
  { id:'ai.generation', domain:'ai', name:'AI generation', state:'PROVIDER_REQUIRED', provider:'LLM provider', requiresEnv:['AI_PROVIDER_API_KEY'], evidence:['governed adapter boundary'] },
  { id:'search.vector', domain:'discovery', name:'Vector search', state:'PROVIDER_REQUIRED', provider:'vector/search provider', evidence:['provider adapter boundary'] },
  { id:'logistics.label', domain:'logistics', name:'Shipping labels', state:'PROVIDER_REQUIRED', provider:'carrier aggregator', evidence:['shipment domain and tracking model'] },
];
export function listCapabilities() { return capabilities.map(c => ({...c, requiresEnv:c.requiresEnv ? [...c.requiresEnv] : undefined})); }
export function getCapability(id:string) { return capabilities.find(c=>c.id===id); }
