export type Query = { name:string; version:number; tenantId:string; actorId:string; correlationId:string; payload:Record<string,unknown> };
export class QueryBus {
  private handlers = new Map<string,(query:Query)=>Promise<unknown>|unknown>();
  register(name:string,version:number,handler:(query:Query)=>Promise<unknown>|unknown){this.handlers.set(`${name}@${version}`,handler);return this;}
  dispatch(query:Query){ if(!query.tenantId||!query.actorId||!query.correlationId) throw new Error('QUERY_CONTEXT_REQUIRED'); const h=this.handlers.get(`${query.name}@${query.version}`); if(!h) throw new Error('QUERY_HANDLER_NOT_FOUND'); return h(query); }
}
