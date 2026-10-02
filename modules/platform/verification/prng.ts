export function nextUint32(state:number):number{let x=state>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0;}
export function sequence(seed:number,count:number):number[]{if(!Number.isInteger(count)||count<0||count>100000)throw new Error('VERIFICATION_ITERATION_LIMIT');let s=seed>>>0;const out:number[]=[];for(let i=0;i<count;i++){s=nextUint32(s);out.push(s)}return out;}
