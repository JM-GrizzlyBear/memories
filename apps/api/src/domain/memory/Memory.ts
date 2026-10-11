export type Visibility = "public" | "friends" | "private";

export interface MemoryPhoto {
  id: string;
  url: string;
  position: number; // 0 = cover
}

export interface Memory {
  id: string;
  userId: string;
  title: string;
  story: string;
  memoryDate: Date; // the day it happened
  location: string | null;
  visibility: Visibility;
  photos: MemoryPhoto[];
  createdAt: Date; // the day it was kept
  updatedAt: Date;
}

export interface MemoryAuthor {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePhotoUrl: string | null;
}

// How people reacted to a memory, from the viewer's point of view
export interface MemoryEngagement {
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
}

export interface MemoryWithAuthor extends Memory, MemoryEngagement {
  author: MemoryAuthor;
}
