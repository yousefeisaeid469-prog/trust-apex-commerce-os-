export type ProblemDetails={type:string;title:string;status:number;detail:string;code:string;requestId?:string;retryable?:boolean};
export function problem(code:string,title:string,status:number,detail:string,requestId?:string,retryable=false):ProblemDetails{return {type:`https://trust.invalid/problems/${code.toLowerCase()}`,title,status,detail,code,requestId,retryable};}
