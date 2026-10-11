export type Visibility = "public" | "friends" | "private";

export interface MemoryPhoto {
  id: string;
  url: string;
  position: number; // 0 = cover
}

export interface MemoryAuthor {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePhotoUrl: string | null;
}

// As the API sends it (JSON dates are strings)
export interface Memory {
  id: string;
  userId: string;
  title: string;
  story: string;
  memoryDate: string;
  location: string | null;
  visibility: Visibility;
  photos: MemoryPhoto[];
  createdAt: string;
  updatedAt: string;
  author?: MemoryAuthor;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
}
