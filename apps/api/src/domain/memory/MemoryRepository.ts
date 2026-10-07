import type { Memory, Visibility } from "./Memory.js";

export interface NewMemoryPhoto {
  url: string;
  storageKey: string;
  position: number;
}

export interface NewMemory {
  userId: string;
  title: string;
  story: string;
  memoryDate: Date;
  location: string | null;
  visibility: Visibility;
  photos: NewMemoryPhoto[];
}

export interface MemoryRepository {
  create(memory: NewMemory): Promise<Memory>;
}
