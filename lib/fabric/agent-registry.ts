import {registerAgent as register} from '../../modules/platform/autonomous-commerce-fabric/core';
import type {AgentRecord} from '../../modules/platform/autonomous-commerce-fabric/contracts';
export type AgentIdentity=AgentRecord;
export function hasCapability(agent:AgentIdentity,capability:string){return agent.status==='ACTIVE'&&agent.capabilities.includes(capability);}
export function registerAgent(existing:AgentIdentity[],agent:AgentIdentity){return register(existing,agent);}
export function resolveAgent(existing:AgentIdentity[],tenantId:string,capability:string){return existing.find(a=>a.tenantId===tenantId&&a.status==='ACTIVE'&&a.capabilities.includes(capability));}
