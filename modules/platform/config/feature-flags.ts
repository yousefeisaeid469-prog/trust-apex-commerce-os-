export type FeatureFlag = "ai_recommendations" | "merchant_analytics" | "payments" | "experimental_checkout";
const truthy=new Set(["1","true","yes","on"]);
export function featureEnabled(flag:FeatureFlag, env:Record<string,string|undefined>=process.env){return truthy.has((env[`TRUST_FEATURE_${flag.toUpperCase()}`]??"").toLowerCase())}
