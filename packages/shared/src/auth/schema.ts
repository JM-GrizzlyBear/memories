import { z } from "zod";

// The same rules everywhere a field appears (register, settings)
export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(25, "Username must be at most 25 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

const firstNameSchema = z
  .string()
  .trim()
  .min(1, "First name is required")
  .max(100, "First name must be at most 100 characters");

const lastNameSchema = z
  .string()
  .trim()
  .min(1, "Last name is required")
  .max(100, "Last name must be at most 100 characters");

const birthdaySchema = z.coerce.date().refine((date) => {
  const today = new Date();
  const minDate = new Date(
    today.getFullYear() - 120,
    today.getMonth(),
    today.getDate(),
  );
  const maxDate = new Date(
    today.getFullYear() - 13,
    today.getMonth(),
    today.getDate(),
  );
  return date >= minDate && date <= maxDate;
}, "You must be between 13 and 120 years old");

export const registerSchema = z.object({
  username: usernameSchema,
  email: z.email("Invalid email").max(255, "Email is too long"),
  password: passwordSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  birthday: birthdaySchema,
});

export type RegisterBody = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  usernameOrEmail: z.string().trim().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginBody = z.infer<typeof loginSchema>;

// Settings → Profile
export const updateProfileSchema = z.object({
  username: usernameSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  birthday: birthdaySchema,
});

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;

// Settings → Password
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Choose a password different from your current one",
    path: ["newPassword"],
  });

export type ChangePasswordBody = z.infer<typeof changePasswordSchema>;

export const PROFILE_PHOTO_LIMITS = {
  maxBytes: 5 * 1024 * 1024, // 5 MB
  types: ["image/jpeg", "image/png", "image/webp"],
} as const;
