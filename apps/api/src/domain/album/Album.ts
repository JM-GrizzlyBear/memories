import type { Visibility } from "../memory/Memory.js";
import type { UserSummary } from "../user/User.js";

// One memory as the album shows it: a print with its cover photo
export interface AlbumMemory {
  id: string;
  title: string;
  memoryDate: string; // "2024-05-14"
  coverUrl: string | null;
  visibility: Visibility;
}

// One spread of the book: a year, its memories (newest first) and the owner's line about it
export interface AlbumYear {
  year: number;
  memoryCount: number;
  note: string | null;
  memories: AlbumMemory[];
}

export interface Album {
  owner: UserSummary;
  years: AlbumYear[]; // newest year first
}
