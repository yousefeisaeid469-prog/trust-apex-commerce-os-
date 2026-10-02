import type {AdapterAction,AdapterCommand,AdapterPolicy,AdapterResult,AdapterRun,CircuitState,DeadLetter,ExecutionAdapter} from './contracts.ts';
const sleep=async(ms:number)=>{if(ms>0) await new Promise(r=>setTimeout(r,ms));};
export class ExecutionAdapterMesh {
  private readonly adapters=new Map<string,ExecutionAdapter>();
  private readonly seen=new Set<string>();
  private readonly circuits=new Map<string,CircuitState>();
  private readonly deadLetters:DeadLetter[]=[];
  register(adapter:ExecutionAdapter){if(this.adapters.has(adapter.name))throw new Error(`ADAPTER_ALREADY_REGISTERED:${adapter.name}`);if(!adapter.actions.length)throw new Error('ADAPTER_ACTIONS_REQUIRED');this.adapters.set(adapter.name,adapter);}
  resolve(action:AdapterAction){const matches=[...this.adapters.values()].filter(a=>a.actions.includes(action));if(matches.length!==1)throw new Error(matches.length===0?'ADAPTER_NOT_FOUND_FOR_ACTION':'AMBIGUOUS_ADAPTER_FOR_ACTION');return matches[0];}
  circuitState(name:string):CircuitState{return {...(this.circuits.get(name)||{adapter:name,failures:0})};}
  deadLettersSnapshot(){return this.deadLetters.map(x=>({...x,payload:{...x.payload}}));}
  async dispatch(command:AdapterCommand,policy:AdapterPolicy,now=Date.now()):Promise<AdapterRun>{
    if(!command.commandId||!command.tenantId||!command.idempotencyKey)throw new Error('COMMAND_IDENTITY_REQUIRED');
    if(policy.maxAttempts<1||policy.failureThreshold<1||policy.baseDelayMs<0||policy.cooldownMs<0)throw new Error('INVALID_ADAPTER_POLICY');
    const adapter=this.resolve(command.action); const circuit=this.circuitState(adapter.name);
    if(circuit.openedAt!==undefined && now-circuit.openedAt<policy.cooldownMs)return {commandId:command.commandId,tenantId:command.tenantId,adapter:adapter.name,status:'CIRCUIT_OPEN',attempts:0,reason:'Circuit breaker is open.'};
    if(this.seen.has(`${command.tenantId}:${command.idempotencyKey}`))return {commandId:command.commandId,tenantId:command.tenantId,adapter:adapter.name,status:'DUPLICATE',attempts:0,reason:'Idempotency key was already dispatched.'};
    let last='Adapter failed.';
    for(let attempt=1;attempt<=policy.maxAttempts;attempt++){
      try { const result=await adapter.execute(command); if(result.status==='SUCCESS'){this.seen.add(`${command.tenantId}:${command.idempotencyKey}`);this.circuits.set(adapter.name,{adapter:adapter.name,failures:0});return {commandId:command.commandId,tenantId:command.tenantId,adapter:adapter.name,status:'EXECUTED',attempts:attempt,providerReference:result.providerReference,reason:'Adapter execution succeeded.'};} last=result.reason||last; }
      catch(e){last=e instanceof Error?e.message:last;}
      const next={adapter:adapter.name,failures:circuit.failures+1};this.circuits.set(adapter.name,next);circuit.failures=next.failures;
      if(circuit.failures>=policy.failureThreshold){this.circuits.set(adapter.name,{adapter:adapter.name,failures:circuit.failures,openedAt:now});break;}
      await sleep(policy.baseDelayMs*Math.pow(2,attempt-1));
    }
    if(circuit.failures>=policy.failureThreshold){const dl={commandId:command.commandId,tenantId:command.tenantId,adapter:adapter.name,payload:{...command.payload},reason:last,createdAt:now};this.deadLetters.push(dl);return {commandId:command.commandId,tenantId:command.tenantId,adapter:adapter.name,status:'DEAD_LETTERED',attempts:policy.maxAttempts,reason:last};}
    return {commandId:command.commandId,tenantId:command.tenantId,adapter:adapter.name,status:'RETRYABLE_FAILURE',attempts:policy.maxAttempts,reason:last};
  }
}
