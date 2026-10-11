export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  birthday: Date;
  profilePhotoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// The public part of a user: safe to show anyone (no email, birthday or password)
export type UserSummary = Pick<
  User,
  "id" | "username" | "firstName" | "lastName" | "profilePhotoUrl"
>;
