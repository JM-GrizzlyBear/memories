import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { Memory } from "../../domain/memory";
import type { JournalPage } from "../../infrastructure/api/memoryApi";
import { queryKeys } from "../query/queryKeys";

// A journal as TanStack Query keeps it: the pages loaded so far, and their cursors
export type JournalData = InfiniteData<JournalPage, string | null>;

function mapJournal(
  data: JournalData | undefined,
  change: (memories: Memory[]) => Memory[],
): JournalData | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      memories: change(page.memories),
    })),
  };
}

// One memory can be on screen in several places at once (the journal, a profile,
// the viewer). These helpers change it everywhere, so every place agrees.

export function updateMemoryInCache(
  queryClient: QueryClient,
  id: string,
  update: (memory: Memory) => Memory,
) {
  queryClient.setQueryData<Memory>(queryKeys.memory(id), (memory) =>
    memory ? update(memory) : memory,
  );
  queryClient.setQueriesData<JournalData>(
    { queryKey: queryKeys.journals },
    (data) =>
      mapJournal(data, (memories) =>
        memories.map((memory) => (memory.id === id ? update(memory) : memory)),
      ),
  );
}

export function replaceMemoryInCache(queryClient: QueryClient, saved: Memory) {
  updateMemoryInCache(queryClient, saved.id, () => saved);
}

// A just-kept memory goes on top of the journal and of its author's profile
export function addMemoryToCache(queryClient: QueryClient, created: Memory) {
  for (const [queryKey] of queryClient.getQueriesData<JournalData>({
    queryKey: queryKeys.journals,
  })) {
    const authorId = queryKey[2];
    if (authorId !== "everyone" && authorId !== created.userId) continue;

    queryClient.setQueryData<JournalData>(queryKey, (data) => {
      if (!data || data.pages.length === 0) return data;
      const alreadyThere = data.pages.some((page) =>
        page.memories.some((memory) => memory.id === created.id),
      );
      if (alreadyThere) return data;
      const [first, ...rest] = data.pages;
      return {
        ...data,
        pages: [{ ...first, memories: [created, ...first.memories] }, ...rest],
      };
    });
  }
  // Journals not on screen right now load fresh the next time they're opened
  void queryClient.invalidateQueries({
    queryKey: queryKeys.journals,
    refetchType: "none",
  });
}

export function removeMemoryFromCache(queryClient: QueryClient, id: string) {
  queryClient.setQueriesData<JournalData>(
    { queryKey: queryKeys.journals },
    (data) =>
      mapJournal(data, (memories) =>
        memories.filter((memory) => memory.id !== id),
      ),
  );
  queryClient.removeQueries({ queryKey: queryKeys.memory(id) });
}
