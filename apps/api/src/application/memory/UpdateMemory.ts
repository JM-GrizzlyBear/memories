import { MEMORY_LIMITS } from "@memories/shared";
import {
  InvalidPhotoOrderError,
  MemoryNotFoundError,
  NotMemoryOwnerError,
} from "../../domain/memory/errors.js";
import type { Visibility } from "../../domain/memory/Memory.js";
import type {
  MemoryRepository,
  StoredMemoryPhoto,
} from "../../domain/memory/MemoryRepository.js";
import { canEdit, canView } from "../../domain/memory/visibility.js";
import type {
  PhotoStorage,
  PhotoUpload,
  StoredPhoto,
} from "../ports/PhotoStorage.js";

// One slot in the new photo list: a photo the memory already has, or a new upload
export type PhotoOrderItem =
  | { kind: "existing"; id: string }
  | { kind: "new"; index: number };

export interface UpdateMemoryInput {
  memoryId: string;
  viewerId: string;
  title: string;
  story: string;
  memoryDate: string; // "2024-05-14"
  location: string | null;
  visibility: Visibility;
  photoOrder: PhotoOrderItem[];
  newPhotos: PhotoUpload[];
}

// Every rule the photo list must follow
function checkPhotoOrder(
  order: PhotoOrderItem[],
  currentFiles: StoredMemoryPhoto[],
  newCount: number,
) {
  if (order.length < 1 || order.length > MEMORY_LIMITS.maxPhotos) {
    throw new InvalidPhotoOrderError(
      `Add between 1 and ${MEMORY_LIMITS.maxPhotos} photos`,
    );
  }

  const ownIds = new Set(currentFiles.map((file) => file.id));
  const usedExisting = new Set<string>();
  const usedNew = new Set<number>();

  for (const item of order) {
    if (item.kind === "existing") {
      // Must be THIS memory's photo (never someone else's), and only once
      if (!ownIds.has(item.id) || usedExisting.has(item.id))
        throw new InvalidPhotoOrderError();
      usedExisting.add(item.id);
    } else {
      if (item.index >= newCount || usedNew.has(item.index))
        throw new InvalidPhotoOrderError();
      usedNew.add(item.index);
    }
  }

  // Every uploaded file must be placed somewhere
  if (usedNew.size !== newCount) throw new InvalidPhotoOrderError();
}

export class UpdateMemory {
  constructor(
    private readonly memories: MemoryRepository,
    private readonly photoStorage: PhotoStorage,
  ) {}

  async execute(input: UpdateMemoryInput) {
    const memory = await this.memories.findById(input.memoryId);
    if (!memory || !canView(memory, input.viewerId))
      throw new MemoryNotFoundError();
    if (!canEdit(memory, input.viewerId)) throw new NotMemoryOwnerError();

    const currentFiles = await this.memories.findPhotoFiles(input.memoryId);
    checkPhotoOrder(input.photoOrder, currentFiles, input.newPhotos.length);

    const storedNew: StoredPhoto[] = [];
    try {
      for (const photo of input.newPhotos) {
        storedNew.push(await this.photoStorage.save(photo));
      }

      const filesById = new Map(currentFiles.map((file) => [file.id, file]));
      const photos = input.photoOrder.map((item, position) => {
        if (item.kind === "existing") {
          const file = filesById.get(item.id)!; // checked above
          return { url: file.url, storageKey: file.storageKey, position };
        }
        return { ...storedNew[item.index], position };
      });

      await this.memories.update(input.memoryId, {
        title: input.title,
        story: input.story,
        memoryDate: new Date(`${input.memoryDate}T00:00:00Z`),
        location: input.location,
        visibility: input.visibility,
        photos,
      });
    } catch (error) {
      // The edit failed: remove the new files we saved, so none are orphaned
      await Promise.allSettled(
        storedNew.map((photo) => this.photoStorage.delete(photo.storageKey)),
      );
      throw error;
    }

    // Only after the database accepted the edit: delete files that are no longer used
    const keptIds = new Set(
      input.photoOrder.flatMap((item) =>
        item.kind === "existing" ? [item.id] : [],
      ),
    );
    const removed = currentFiles.filter((file) => !keptIds.has(file.id));
    await Promise.allSettled(
      removed.map((file) => this.photoStorage.delete(file.storageKey)),
    );

    const updated = await this.memories.findById(input.memoryId);
    if (!updated) throw new MemoryNotFoundError();
    return updated;
  }
}
