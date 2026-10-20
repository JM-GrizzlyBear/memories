// Values for the forgot-password tests
export const APP_URL = "http://memories.test";
export const NEW_PASSWORD = "a-brand-new-password";

// What the reset form sends
export function resetBody(
  token: string,
  overrides: Partial<{ newPassword: string; confirmPassword: string }> = {},
) {
  return {
    token,
    newPassword: NEW_PASSWORD,
    confirmPassword: NEW_PASSWORD,
    ...overrides,
  };
}
