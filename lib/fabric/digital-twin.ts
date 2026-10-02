export type Scenario={name:string;changes:Record<string,unknown>};
export function simulate(s:Scenario){
  return {scenario:s.name,status:"simulated",productionSideEffects:false,
    outputs:["revenue_delta","margin_delta","inventory_delta","conversion_delta"]};
}
