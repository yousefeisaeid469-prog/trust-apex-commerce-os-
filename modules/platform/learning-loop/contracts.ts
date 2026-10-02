export type OutcomeStatus='OBSERVED'|'MISSING'|'INVALID';
export type AutonomyAdjustment='RAISE'|'HOLD'|'LOWER';
export interface Prediction { predictionId:string; tenantId:string; decisionId:string; metric:string; predicted:number; confidenceBps:number; createdAt:number; }
export interface Outcome { predictionId:string; tenantId:string; observed:number; observedAt:number; status:OutcomeStatus; }
export interface Calibration { predictionId:string; tenantId:string; metric:string; predicted:number; observed:number; error:number; absoluteError:number; signedError:number; confidenceBps:number; status:OutcomeStatus; }
export interface LearningReport { tenantId:string; evaluated:number; valid:number; meanAbsoluteError:number; meanSignedError:number; calibrationScoreBps:number; driftBps:number; recommendation:AutonomyAdjustment; calibrations:Calibration[]; generatedAt:number; }
export interface AutonomyPolicy { currentLevel:'SUGGEST'|'APPROVAL_REQUIRED'|'AUTO_EXECUTE'; minConfidenceBps:number; maxMeanAbsoluteError:number; maxDriftBps:number; }
