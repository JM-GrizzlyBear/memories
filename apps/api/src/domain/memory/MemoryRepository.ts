import type { Memory, MemoryWithAuthor, Visibility } from "./Memory.js";

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

// A bookmark in the journal: the exact created_at text from Postgres + the id
export interface JournalCursor {
  createdAt: string;
  id: string;
}

export interface JournalQuery {
  viewerId: string;
  limit: number;
  after: JournalCursor | null; // null = start from the newest
}

export interface JournalItem {
  memory: MemoryWithAuthor;
  cursor: JournalCursor;
}

export interface MemoryRepository {
  create(memory: NewMemory): Promise<Memory>;
  findJournal(query: JournalQuery): Promise<JournalItem[]>;
  findById(id: string): Promise<MemoryWithAuthor | null>;
}
