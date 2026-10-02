import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from '../../modules/platform/admin/access';
import MerchantVerificationReview from './MerchantVerificationReview';

export const dynamic = 'force-dynamic';

export default async function MerchantVerificationAdminPage() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value ?? null;
  const admin = await verifyAdminSession(token);
  if (!admin) redirect('/admin-login?next=/merchant-verification-admin');
  return <MerchantVerificationReview />;
}
