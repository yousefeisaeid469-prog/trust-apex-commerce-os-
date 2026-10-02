export const API_VERSION="v1" as const;
export function apiPath(path:string){ return `/api/${API_VERSION}/${path.replace(/^\//,"")}`; }
export function correlationHeaders(requestId:string){ return {"x-request-id":requestId,"x-api-version":API_VERSION}; }
