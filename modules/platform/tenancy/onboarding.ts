export type OnboardingStage='identity'|'workspace'|'catalog'|'payments'|'launch';
export type OnboardingState={userId:string;stage:OnboardingStage;completed:OnboardingStage[];updatedAt:string};
const order:OnboardingStage[]=['identity','workspace','catalog','payments','launch'];
export function createOnboarding(userId:string):OnboardingState{return{userId,stage:'identity',completed:[],updatedAt:new Date().toISOString()};}
export function advanceOnboarding(current:OnboardingState,next:OnboardingStage){
 if(!order.includes(next))throw new Error('INVALID_ONBOARDING_STAGE');
 const currentIndex=order.indexOf(current.stage),nextIndex=order.indexOf(next);
 if(nextIndex>currentIndex+1)throw new Error('ONBOARDING_STAGE_ORDER');
 const additions=nextIndex>currentIndex?order.slice(currentIndex,nextIndex):[];
 return {...current,stage:next,completed:Array.from(new Set([...current.completed,...additions])),updatedAt:new Date().toISOString()};
}
