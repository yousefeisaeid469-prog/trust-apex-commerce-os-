import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '../admin/access';
export async function requireAdminSession(request:Request){
 const token=request.headers.get('cookie')?.match(new RegExp(`${ADMIN_SESSION_COOKIE}=([^;]+)`))?.[1]??null;
 const session=await verifyAdminSession(token);
 if(!session) throw new Error('ADMIN_AUTH_REQUIRED');
 return session;
}
