import {rankNextBestAction} from '../../modules/platform/autonomous-commerce-fabric/core';
import type {RiskLevel} from '../../modules/platform/autonomous-commerce-fabric/contracts';
export type Candidate={id:string;impact:number;confidence:number;cost:number;risk:RiskLevel;reversible:boolean};
export function rank(candidates:Candidate[]){return rankNextBestAction(candidates);}
export function select(candidates:Candidate[]){return rank(candidates)[0]??null;}
