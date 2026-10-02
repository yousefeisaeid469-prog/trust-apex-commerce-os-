import type {ReliabilityPolicy} from '../reliability-control-plane/policy.ts';
import type {DeploymentObservation,DeploymentGate} from '../deployment-autopilot/contracts.ts';
import {evaluateDeploymentObservation} from '../deployment-autopilot/gate.ts';
export function evaluateStage(policy:ReliabilityPolicy,observation:DeploymentObservation,observedAt:string):DeploymentGate{return evaluateDeploymentObservation(policy,observation,observedAt);}
