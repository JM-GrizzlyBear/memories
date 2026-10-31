import type { PasswordResetLink } from "./PasswordResetLink.js";

export interface NewPasswordResetLink {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface PasswordResetRepository {
  // Saves a new link and deletes the user's older ones: only the newest email works
  replaceForUser(link: NewPasswordResetLink): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetLink | null>;
  // Marks it used and deletes the user's other links
  markUsed(id: string, usedAt: Date): Promise<void>;
}
