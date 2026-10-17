export type Visibility = "public" | "friends" | "private";

export interface MemoryFields {
  title: string;
  story: string;
  memoryDate: string;
  visibility: Visibility;
}

// A valid memory form; tests change only the fields they care about
export function memoryFields(
  overrides: Partial<MemoryFields> = {},
): MemoryFields {
  return {
    title: "A day out",
    story: "A day to remember.",
    memoryDate: "2024-05-14",
    visibility: "public",
    ...overrides,
  };
}

// Maria's memories for the album test: two in 2025 (one private), one in 2024
export const ALBUM_MEMORIES: MemoryFields[] = [
  memoryFields({ title: "Graduation", memoryDate: "2024-06-21" }),
  memoryFields({ title: "Moving day", memoryDate: "2025-11-30" }),
  memoryFields({
    title: "Diary",
    memoryDate: "2025-02-14",
    visibility: "private",
  }),
];
