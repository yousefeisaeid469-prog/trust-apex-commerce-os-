import { apiResponse, apiError } from '../../../../modules/platform/http/response';
import { createRequestContext } from '../../../../modules/platform/runtime/request-context';
import { listCapabilities } from '../../../../modules/platform/capabilities/registry';
export async function GET(request:Request){ const ctx=createRequestContext({ip:request.headers.get('x-forwarded-for')??undefined,userAgent:request.headers.get('user-agent')??undefined}); try{return apiResponse({surfaceStatus:'LIVE',capabilities:listCapabilities()},ctx,{},'LIVE');}catch(e){return apiError(e,ctx);} }
