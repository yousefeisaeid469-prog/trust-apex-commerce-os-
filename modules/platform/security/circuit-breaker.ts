export type CircuitState = "closed" | "open" | "half-open";
export class CircuitBreaker {
  private failures=0; private openedAt=0; private state:CircuitState="closed";
  constructor(private readonly threshold=5, private readonly cooldownMs=30_000) {}
  getState():CircuitState { if(this.state==="open" && Date.now()-this.openedAt>=this.cooldownMs) this.state="half-open"; return this.state; }
  async execute<T>(fn:()=>Promise<T>):Promise<T>{ if(this.getState()==="open") throw new Error("CIRCUIT_OPEN"); try { const out=await fn(); this.failures=0; this.state="closed"; return out; } catch(e){ this.failures++; if(this.failures>=this.threshold){this.state="open";this.openedAt=Date.now();} throw e; } }
}
