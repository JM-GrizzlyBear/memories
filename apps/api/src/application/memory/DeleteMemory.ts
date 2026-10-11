import { NotMemoryOwnerError } from "../../domain/memory/errors.js";
import type { MemoryRepository } from "../../domain/memory/MemoryRepository.js";
import { canEdit } from "../../domain/memory/visibility.js";
import type { PhotoStorage } from "../ports/PhotoStorage.js";
import type { MemoryAccess } from "./MemoryAccess.js";

export interface DeleteMemoryInput {
  memoryId: string;
  viewerId: string;
}

export class DeleteMemory {
  constructor(
    private readonly memories: MemoryRepository,
    private readonly photoStorage: PhotoStorage,
    private readonly access: MemoryAccess,
  ) {}

  async execute({ memoryId, viewerId }: DeleteMemoryInput) {
    const memory = await this.access.findViewable(memoryId, viewerId);
    if (!canEdit(memory, viewerId)) throw new NotMemoryOwnerError();

    // Remember the files before the rows are gone
    const files = await this.memories.findPhotoFiles(memoryId);

    await this.memories.delete(memoryId); // photo rows go too (ON DELETE CASCADE)
    await Promise.allSettled(
      files.map((file) => this.photoStorage.delete(file.storageKey)),
    );
  }
}
