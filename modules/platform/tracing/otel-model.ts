export type SpanStatus='UNSET'|'OK'|'ERROR';
export type Span={traceId:string;spanId:string;parentSpanId?:string;name:string;startTime:number;endTime?:number;status:SpanStatus;attributes:Record<string,string|number|boolean>};
export function startSpan(traceId:string,spanId:string,name:string,parentSpanId?:string):Span{ if(!traceId||!spanId||!name) throw new Error('TRACE_CONTEXT_REQUIRED'); return {traceId,spanId,parentSpanId,name,startTime:Date.now(),status:'UNSET',attributes:{}}; }
export function finishSpan(span:Span,status:SpanStatus='OK',endTime=Date.now()):Span{ if(endTime<span.startTime) throw new Error('TRACE_TIME_INVALID'); return {...span,endTime,status}; }
