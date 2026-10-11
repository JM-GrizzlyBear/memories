export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  birthday: Date;
  profilePhotoUrl: string | null;
  profilePhotoKey: string | null; // where the photo is stored, to delete it later
  createdAt: Date;
  updatedAt: Date;
}

// What the logged-in user may see about themselves (no password hash, no storage key)
export type SafeUser = Omit<User, "passwordHash" | "profilePhotoKey">;

export function toSafeUser(user: User): SafeUser {
  const { passwordHash: _hash, profilePhotoKey: _key, ...safeUser } = user;
  return safeUser;
}

// The public part of a user: safe to show anyone (no email, birthday or password)
export type UserSummary = Pick<
  User,
  "id" | "username" | "firstName" | "lastName" | "profilePhotoUrl"
>;
