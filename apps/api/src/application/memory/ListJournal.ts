import type {
  JournalCursor,
  MemoryRepository,
} from "../../domain/memory/MemoryRepository.js";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 20;

export interface ListJournalInput {
  viewerId: string;
  authorId?: string | null; // set = only this person's memories (their profile)
  limit?: number;
  after: JournalCursor | null;
}

export class ListJournal {
  constructor(private readonly memories: MemoryRepository) {}

  async execute(input: ListJournalInput) {
    const pageSize = Math.min(
      Math.max(input.limit ?? DEFAULT_PAGE_SIZE, 1),
      MAX_PAGE_SIZE,
    );

    // Ask for one extra: if it exists, there is another page
    const items = await this.memories.findJournal({
      viewerId: input.viewerId,
      authorId: input.authorId ?? null,
      limit: pageSize + 1,
      after: input.after,
    });

    const hasMore = items.length > pageSize;
    const page = items.slice(0, pageSize);

    return {
      memories: page.map((item) => item.memory),
      nextCursor: hasMore ? page[page.length - 1].cursor : null,
    };
  }
}
