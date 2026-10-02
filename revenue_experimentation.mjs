import {buildRevenueLearningPlan} from '../modules/platform/revenue-experimentation/index.ts';
const plan=buildRevenueLearningPlan([{experimentId:'demo',programId:'marketplace-commission',controlEligible:100,treatmentEligible:100,controlConversions:20,treatmentConversions:30,controlRevenueMinor:20000n,treatmentRevenueMinor:33000n,controlCostMinor:2000n,treatmentCostMinor:3000n}]);
console.log(JSON.stringify(plan,(_,v)=>typeof v==='bigint'?v.toString():v,null,2));
