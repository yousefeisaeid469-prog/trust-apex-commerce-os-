export type Tenant={id:string;status:'ACTIVE'|'SUSPENDED';plan:string};
export function assertTenantIsolation(requestTenant:string,resourceTenant:string):void{if(requestTenant!==resourceTenant)throw new Error('TENANT_ISOLATION_VIOLATION');}
export function tenantCanOperate(t:Tenant):boolean{return t.status==='ACTIVE';}
