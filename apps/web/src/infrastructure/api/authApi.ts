import type { User } from "../../domain/user";
import { request } from "./http";

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
