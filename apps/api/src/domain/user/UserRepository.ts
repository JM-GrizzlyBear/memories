import type { User } from "./User.js";

export type NewUser = Omit<User, "id" | "createdAt" | "updatedAt">;

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  create(user: NewUser): Promise<User>;
}
