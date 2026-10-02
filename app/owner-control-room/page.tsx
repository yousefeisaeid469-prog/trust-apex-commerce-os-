import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '../../modules/platform/admin/access';
import { isOwnerEmail, ownerEmailConfigured } from '../../modules/platform/owner-control-room/core';
import SuperControlPlane from './SuperControlPlane';
export const dynamic='force-dynamic'; export const revalidate=0;
export default async function OwnerControlRoomPage(){
 if(!ownerEmailConfigured()) redirect('/admin-login?next=/owner-control-room');
 const token=cookies().get(ADMIN_SESSION_COOKIE)?.value??null; const session=await verifyAdminSession(token);
 if(!session || !isOwnerEmail(session.email)) redirect('/admin-login?next=/owner-control-room');
 return <SuperControlPlane/>;
}
