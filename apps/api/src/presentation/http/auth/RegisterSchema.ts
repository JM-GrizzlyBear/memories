import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(25, "Username must be at most 25 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),

  email: z.email("Invalid email").max(255, "Email is too long"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),

  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name must be at most 100 characters"),

  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(100, "Last name must be at most 100 characters"),

  birthday: z.coerce.date().refine((date) => {
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
  }, "You must be between 13 and 120 years old"),
});

export type RegisterBody = z.infer<typeof registerSchema>;
