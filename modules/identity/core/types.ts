export type UserRole = 'customer' | 'merchant' | 'admin' | 'support' | 'operations';
export type AccountStatus = 'active' | 'pending' | 'suspended';

export interface UserAccount {
  id: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  merchantId?: string;
  createdAt: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  revokedAt?: string;
}
