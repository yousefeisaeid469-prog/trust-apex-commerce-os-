import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminWarRoom from './AdminWarRoom';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '../../modules/platform/admin/access';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPage() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value ?? null;
  const admin = await verifyAdminSession(token);
  if (!admin) redirect('/admin-login?next=/admin');
  return <AdminWarRoom />;
}
