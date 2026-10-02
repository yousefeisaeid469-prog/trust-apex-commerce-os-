import {sequence} from './prng.ts';
export type Machine={state:string;terminal:string[];transitions:Record<string,string[]>};
export function fuzzStateMachine(machine:Machine,seed:number,iterations:number){let state=machine.state;let illegal=0;const trace:string[]=[];for(const n of sequence(seed,iterations)){const choices=machine.transitions[state]??[];if(!choices.length){if(!machine.terminal.includes(state))illegal++;break}const next=choices[n%choices.length];trace.push(`${state}->${next}`);state=next}return {finalState:state,illegal,trace}}
