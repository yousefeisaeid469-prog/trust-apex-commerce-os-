import type {DeploymentLock,IdempotencyStore,InfrastructureTarget,ProductionInfrastructureAdapter,TrafficTarget} from './contracts.ts';
export class ProductionOrchestrator {
 private adapter:ProductionInfrastructureAdapter; private locks:DeploymentLock; private idem:IdempotencyStore;
 constructor(adapter:ProductionInfrastructureAdapter,locks:DeploymentLock,idem:IdempotencyStore){this.adapter=adapter;this.locks=locks;this.idem=idem;}
 async execute(id:string,owner:string,target:InfrastructureTarget,traffic:TrafficTarget){
  const key=`deploy:${id}`,cached=await this.idem.get(key); if(cached)return JSON.parse(cached);
  if(!(await this.locks.acquire(key,owner,60000)))throw new Error('DEPLOYMENT_LOCK_UNAVAILABLE');
  try{
   if(!(await this.adapter.preflight(target)))throw new Error('PREFLIGHT_FAILED');
   const revision=(await this.adapter.deploy(target)).revision;
   if(!(await this.adapter.shiftTraffic(traffic)))throw new Error('TRAFFIC_SHIFT_FAILED');
   if(!(await this.adapter.promote(traffic.service)))throw new Error('PROMOTION_FAILED');
   if(!(await this.adapter.verify(traffic.service)))throw new Error('POST_DEPLOY_VERIFY_FAILED');
   const out={id,revision,status:'COMPLETE',runtimeVerified:true}; await this.idem.put(key,JSON.stringify(out),86400000); return out;
  }catch(e){const rolled=await this.adapter.rollback(traffic.service).catch(()=>false),verified=rolled&&await this.adapter.verify(traffic.service).catch(()=>false);if(!verified)throw new Error(`ROLLBACK_VERIFICATION_FAILED:${e instanceof Error?e.message:String(e)}`);throw e}
  finally{await this.locks.release(key,owner)}
 }
}
