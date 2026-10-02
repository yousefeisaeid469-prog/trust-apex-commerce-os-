export type Assertion<T=unknown>={name:string;check:(value:T)=>boolean};
export function assertInvariants<T>(value:T,assertions:Assertion<T>[]):void{for(const a of assertions)if(!a.check(value))throw new Error(`INVARIANT_VIOLATION:${a.name}`)}
export function stableDigest(parts:string[]):string{let h=2166136261>>>0;for(const part of [...parts].sort()){for(const c of part){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0}}return h.toString(16).padStart(8,'0')}
