import {authorizeAction as authorizeFabric} from '../../modules/platform/autonomous-commerce-fabric/core';
import type {ActionContext} from '../../modules/platform/autonomous-commerce-fabric/contracts';
export type ActionRequest=ActionContext;
export function authorize(a:ActionRequest,agent?:Parameters<typeof authorizeFabric>[1]){return authorizeFabric(a,agent);}
