import { PASSWORD_RESET_MINUTES } from "@memories/shared";
import type { PasswordResetLink } from "./PasswordResetLink.js";

export function resetLinkExpiry(now: Date) {
  return new Date(now.getTime() + PASSWORD_RESET_MINUTES * 60 * 1000);
}

// A link works once, until it expires
export function isResetLinkUsable(
  link: Pick<PasswordResetLink, "expiresAt" | "usedAt">,
  now: Date,
) {
  return link.usedAt === null && now.getTime() < link.expiresAt.getTime();
}
