export type Transition<S extends string, E extends string> = { from: S; event: E; to: S };
export type TransitionResult<S extends string> = { state: S; changed: boolean; transitionKey: string };
export function transition<S extends string, E extends string>(state: S, event: E, transitions: readonly Transition<S,E>[]): TransitionResult<S> { const match=transitions.find(t=>t.from===state&&t.event===event); if(!match) throw new Error(`INVALID_TRANSITION:${String(state)}:${String(event)}`); return {state:match.to,changed:match.to!==state,transitionKey:`${match.from}->${match.event}->${match.to}`}; }
export function assertTerminalState<S extends string>(state:S,terminal:readonly S[]):void{if(!terminal.includes(state))throw new Error('NON_TERMINAL_STATE');}
