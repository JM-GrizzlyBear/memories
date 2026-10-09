import type { UserSummary } from "./friendship";

export interface Comment {
  id: string;
  memoryId: string;
  body: string;
  createdAt: string;
  author: UserSummary;
}
