import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '../admin/access';
import { isOwnerEmail, ownerEmailConfigured } from '../owner-control-room/core';
export async function requireOwnerSession(request:Request){
 if(!ownerEmailConfigured()) throw new Error('OWNER_ACCESS_NOT_CONFIGURED');
 const token=request.headers.get('cookie')?.match(new RegExp(`${ADMIN_SESSION_COOKIE}=([^;]+)`))?.[1]??null;
 const session=await verifyAdminSession(token);
 if(!session || !isOwnerEmail(session.email)) throw new Error('OWNER_AUTH_REQUIRED');
 return session;
}
