import type {DeploymentEvidenceStore} from './contracts.ts';
import type {ProductionEvidenceBundle} from '../production-reliability/evidence.ts';
export class InMemoryDeploymentEvidenceStore implements DeploymentEvidenceStore { private items=new Map<string,ProductionEvidenceBundle>(); record(bundle:ProductionEvidenceBundle){this.items.set(bundle.candidateHash,bundle);} get(candidateHash:string){return this.items.get(candidateHash);} }
