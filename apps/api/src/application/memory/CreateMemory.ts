import { MEMORY_LIMITS } from "@memories/shared";
import {
  InvalidPhotoCountError,
  MemoryNotFoundError,
} from "../../domain/memory/errors.js";
import type { Visibility } from "../../domain/memory/Memory.js";
import type { MemoryRepository } from "../../domain/memory/MemoryRepository.js";
import type {
  PhotoStorage,
  PhotoUpload,
  StoredPhoto,
} from "../ports/PhotoStorage.js";

export interface CreateMemoryInput {
  userId: string;
  title: string;
  story: string;
  memoryDate: string; // "2024-05-14"
  location: string | null;
  visibility: Visibility;
  photos: PhotoUpload[];
}

export class CreateMemory {
  constructor(
    private readonly memories: MemoryRepository,
    private readonly photoStorage: PhotoStorage,
  ) {}

  async execute(input: CreateMemoryInput) {
    // Business rule: a memory needs 1 to 10 photos.
    // The database can't check this (photos live in another table), so it lives here.
    const count = input.photos.length;
    if (count < 1 || count > MEMORY_LIMITS.maxPhotos) {
      throw new InvalidPhotoCountError(MEMORY_LIMITS.maxPhotos);
    }

    const stored: StoredPhoto[] = [];
    let createdId: string;
    try {
      // Save in order, so position 0 is the first photo (the cover)
      for (const photo of input.photos) {
        stored.push(await this.photoStorage.save(photo));
      }

      const created = await this.memories.create({
        userId: input.userId,
        title: input.title,
        story: input.story,
        memoryDate: new Date(`${input.memoryDate}T00:00:00Z`),
        location: input.location,
        visibility: input.visibility,
        photos: stored.map((photo, position) => ({ ...photo, position })),
      });
      createdId = created.id;
    } catch (error) {
      // Something failed halfway: delete the files we already saved, so none are orphaned
      await Promise.allSettled(
        stored.map((photo) => this.photoStorage.delete(photo.storageKey)),
      );
      throw error;
    }

    // Send it back the same way the journal shows it: with the author and counts
    const memory = await this.memories.findById(createdId, input.userId);
    if (!memory) throw new MemoryNotFoundError();
    return memory;
  }
}
