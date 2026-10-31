import { z } from "zod";
import { passwordSchema } from "./schema.js";

// How long a reset link works, in minutes (the API and the emails both use it)
export const PASSWORD_RESET_MINUTES = 30;

// Forgot password → "send me a link"
export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email").max(255, "Email is too long"),
});

export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>;

// The token from the link in the email
const resetTokenSchema = z
  .string()
  .trim()
  .min(1, "This link is incomplete")
  .max(200, "This link is incomplete");

export const checkResetLinkSchema = z.object({ token: resetTokenSchema });

// Choose a new password (from the email link)
export const resetPasswordSchema = z
  .object({
    token: resetTokenSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Type your new password again"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>;
