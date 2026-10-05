import type { User } from "../../domain/user";
import { ApiError, request } from "./http";

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthday: string; // "2000-05-14", the format date inputs give
}

export async function register(input: RegisterInput): Promise<User> {
  const data = await request<{ user: User }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.user;
}

// Your turn: write `LoginInput` and `login(...)` the same way.
// Hint: what fields does your loginSchema expect, and what's the route?

export interface LoginInput {
  usernameOrEmail: string; // the first field your backend loginSchema expects
  password: string;
}

export async function login(input: LoginInput): Promise<User> {
  const data = await request<{ user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.user;
}

// Who is logged in? Returns null when nobody is (401 is normal here, not an error)
export async function getCurrentUser(): Promise<User | null> {
  try {
    const data = await request<{ user: User }>("/auth/me");
    return data.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function logout(): Promise<void> {
  await request<void>("/auth/logout", { method: "POST" });
}
