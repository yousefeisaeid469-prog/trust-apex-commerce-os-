/** Deterministic in-process carrier used only for TRUST-E2E sandbox execution. */
export function createSandboxLabel(input:{shipmentId:string;orderId:string;service:string;destination:unknown}){
  const seed=`${input.shipmentId}:${input.orderId}:${input.service}`;
  let h=2166136261;
  for(const ch of seed){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
  const token=(h>>>0).toString(36).toUpperCase().padStart(7,'0');
  return {trackingNumber:`TRUST${token}`,providerReference:`TRUST-E2E-LABEL-${token}`};
}
