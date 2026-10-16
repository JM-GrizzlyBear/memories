import type { MessagePrivacy } from "@memories/shared";

// A user as the API sends it (JSON has no Date type, so dates are strings)
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  birthday: string; // "2000-05-14T00:00:00.000Z"
  profilePhotoUrl: string | null;
  messagePrivacy: MessagePrivacy; // who can message me: "friends" or "anyone"
  createdAt: string;
  updatedAt: string;
}
