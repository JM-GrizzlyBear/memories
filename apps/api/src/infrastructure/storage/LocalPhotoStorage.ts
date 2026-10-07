import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  PhotoStorage,
  PhotoUpload,
  StoredPhoto,
} from "../../application/ports/PhotoStorage.js";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export class LocalPhotoStorage implements PhotoStorage {
  constructor(
    private readonly directory: string,
    private readonly publicPath = "/uploads",
  ) {}

  async save(photo: PhotoUpload): Promise<StoredPhoto> {
    const extension = EXTENSIONS[photo.mimeType];
    if (!extension) {
      throw new Error(`Unsupported photo type: ${photo.mimeType}`);
    }

    // A random name: users can't guess other photos, and two uploads never collide
    const storageKey = `${randomUUID()}${extension}`;

    await mkdir(this.directory, { recursive: true });
    await writeFile(path.join(this.directory, storageKey), photo.data);

    return { storageKey, url: `${this.publicPath}/${storageKey}` };
  }

  async delete(storageKey: string): Promise<void> {
    // basename() blocks paths like "../../secret", so only files in our folder can be deleted
    await rm(path.join(this.directory, path.basename(storageKey)), {
      force: true,
    });
  }
}
