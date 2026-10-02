import {optimizeNetwork} from '../global-logistics-v311/optimizer.ts';
import type {NetworkCapacity,NetworkObjective,NetworkPlan,NetworkShipment} from '../global-logistics-v311/contracts.ts';
import type {LearnedCarrierProfile} from './contracts.ts';
export function optimizeAdaptiveNetwork(shipments:NetworkShipment[],capacities:NetworkCapacity[]=[],objective:NetworkObjective='BALANCED',now=new Date().toISOString(),idempotencyKey='adaptive-preview',profiles:LearnedCarrierProfile[]=[]):NetworkPlan{
 const plan=optimizeNetwork(shipments,capacities,objective,now,idempotencyKey,profiles);
 return {...plan,version:'V312.0.0',allocations:plan.allocations.map(a=>({...a,reasons:[...a.reasons,'ADAPTIVE_LEARNING_ENABLED']}))};
}
