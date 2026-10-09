import { MemoryNotFoundError } from "../../domain/memory/errors.js";
import type { MemoryRepository } from "../../domain/memory/MemoryRepository.js";
import { canView } from "../../domain/memory/visibility.js";

export interface GetMemoryInput {
  memoryId: string;
  viewerId: string;
}

export class GetMemory {
  constructor(private readonly memories: MemoryRepository) {}

  async execute({ memoryId, viewerId }: GetMemoryInput) {
    const memory = await this.memories.findById(memoryId);

    // "Doesn't exist" and "not allowed" look identical,
    // so nobody can discover private memories by guessing ids
    if (!memory || !canView(memory, viewerId)) {
      throw new MemoryNotFoundError();
    }

    return memory;
  }
}
