export type Invariant<T>={name:string;check:(value:T)=>boolean};
export function checkInvariants<T>(value:T,invariants:Invariant<T>[]):string[]{return invariants.filter(i=>!i.check(value)).map(i=>i.name);}
export function deterministicCases(seed:number,count:number):number[]{let x=seed>>>0;const out:number[]=[];for(let i=0;i<count;i++){x=(Math.imul(x,1664525)+1013904223)>>>0;out.push(x);}return out;}
export function assertDeterministic<T>(factory:(seed:number)=>T,seed:number):void{const a=JSON.stringify(factory(seed));const b=JSON.stringify(factory(seed));if(a!==b)throw new Error('NON_DETERMINISTIC_RESULT');}
