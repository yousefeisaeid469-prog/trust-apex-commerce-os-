export type WorkflowState='PENDING'|'RUNNING'|'WAITING'|'SUCCEEDED'|'FAILED'|'COMPENSATING';
export type WorkflowStep={id:string;name:string;retryable?:boolean;compensate?:string};
export type WorkflowDefinition={id:string;version:number;description:string;steps:WorkflowStep[]};
export type WorkflowInstance={id:string;definitionId:string;state:WorkflowState;currentStep?:string;correlationId:string;createdAt:string;updatedAt:string};
const defs:WorkflowDefinition[]=[
{id:'order-fulfillment',version:1,description:'Order → payment → reservation → fulfillment orchestration',steps:[{id:'payment',name:'Confirm payment',retryable:true},{id:'reserve',name:'Reserve inventory',retryable:true,compensate:'release-reservation'},{id:'fulfill',name:'Create fulfillment',retryable:true}]},
{id:'customer-recovery',version:1,description:'Detect service issue → notify → recover experience',steps:[{id:'detect',name:'Evaluate signal'},{id:'notify',name:'Send notification',retryable:true},{id:'follow-up',name:'Schedule follow-up'}]},
];
const instances:WorkflowInstance[]=[]; const id=()=>globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function definitions(){return defs}
export function startWorkflow(definitionId:string,correlationId:string){if(!defs.some(d=>d.id===definitionId))throw new Error('WORKFLOW_NOT_FOUND');const now=new Date().toISOString();const x:WorkflowInstance={id:id(),definitionId,state:'PENDING',correlationId,createdAt:now,updatedAt:now};instances.unshift(x);return x}
export function setWorkflowState(id:string,state:WorkflowState,currentStep?:string){const x=instances.find(i=>i.id===id);if(!x)return null;x.state=state;x.currentStep=currentStep;x.updatedAt=new Date().toISOString();return x}
export function workflowSnapshot(){return {definitions:defs,instances:instances.slice(0,50)}}
