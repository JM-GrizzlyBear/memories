// One "forgot password" link. Only a hash of its secret token is stored, so the
// database alone (a backup, a leak) can't be used to reset anyone's password.
export interface PasswordResetLink {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}
