export type IncidentEvent={sequence:number;type:string;at:number;payload:Record<string,unknown>};
export type Incident={id:string;startedAt:number;events:IncidentEvent[]};
export function validateIncident(i:Incident):void{let expected=1;for(const e of i.events){if(e.sequence!==expected)throw new Error('INCIDENT_SEQUENCE_GAP');if(e.at<i.startedAt)throw new Error('INCIDENT_TIME_BEFORE_START');expected++;}}
export function replayIncident(i:Incident):Record<string,unknown>{validateIncident(i);const state:Record<string,unknown>={incidentId:i.id,status:'OPEN',events:0};for(const e of i.events){state.events=e.sequence;if(e.type==='RESOLVED')state.status='RESOLVED';if(e.type==='REOPENED')state.status='OPEN';}return state;}
