import { request } from "./http";

// Can this server send the reset email? (false on the free-hosted live site)
export async function getPasswordResetStatus() {
  return await request<{ available: boolean }>("/auth/password-reset");
}

export async function requestPasswordReset(email: string) {
  await request<{ ok: true }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

// Whose link is it? Fails with code "invalid_link" when it expired or was used
export async function checkResetLink(token: string) {
  return await request<{ username: string; email: string }>(
    "/auth/reset-password/check",
    { method: "POST", body: JSON.stringify({ token }) },
  );
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export async function resetPassword(input: ResetPasswordInput) {
  await request<void>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
