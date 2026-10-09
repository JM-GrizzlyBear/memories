import {
  MemoryNotFoundError,
  NotMemoryOwnerError,
} from "../../domain/memory/errors.js";
import type { MemoryRepository } from "../../domain/memory/MemoryRepository.js";
import { canEdit, canView } from "../../domain/memory/visibility.js";
import type { PhotoStorage } from "../ports/PhotoStorage.js";

export interface DeleteMemoryInput {
  memoryId: string;
  viewerId: string;
}

export class DeleteMemory {
  constructor(
    private readonly memories: MemoryRepository,
    private readonly photoStorage: PhotoStorage,
  ) {}

  async execute({ memoryId, viewerId }: DeleteMemoryInput) {
    const memory = await this.memories.findById(memoryId);
    if (!memory || !canView(memory, viewerId)) throw new MemoryNotFoundError();
    if (!canEdit(memory, viewerId)) throw new NotMemoryOwnerError();

    // Remember the files before the rows are gone
    const files = await this.memories.findPhotoFiles(memoryId);

    await this.memories.delete(memoryId); // photo rows go too (ON DELETE CASCADE)
    await Promise.allSettled(
      files.map((file) => this.photoStorage.delete(file.storageKey)),
    );
  }
}
