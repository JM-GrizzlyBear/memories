import type { PhotoStorage } from "../../application/ports/PhotoStorage.js";
import {
  CloudinaryPhotoStorage,
  parseCloudinaryUrl,
} from "./CloudinaryPhotoStorage.js";
import { LocalPhotoStorage } from "./LocalPhotoStorage.js";

export type PhotoStorageKind = "local" | "cloudinary";

// PHOTO_STORAGE=cloudinary → Cloudinary; unset or "local" → the uploads folder
export function photoStorageKind(env: NodeJS.ProcessEnv): PhotoStorageKind {
  const kind = env.PHOTO_STORAGE?.trim() || "local";
  if (kind !== "local" && kind !== "cloudinary") {
    throw new Error(
      `PHOTO_STORAGE must be "local" or "cloudinary" (got "${kind}")`,
    );
  }
  return kind;
}

export function createPhotoStorage(
  env: NodeJS.ProcessEnv,
  uploadsDir: string,
): PhotoStorage {
  if (photoStorageKind(env) === "local") {
    return new LocalPhotoStorage(uploadsDir);
  }

  const cloudinaryUrl = env.CLOUDINARY_URL?.trim();
  if (!cloudinaryUrl) {
    throw new Error(
      "CLOUDINARY_URL is missing (needed when PHOTO_STORAGE=cloudinary)",
    );
  }
  return new CloudinaryPhotoStorage({
    ...parseCloudinaryUrl(cloudinaryUrl),
    folder: env.CLOUDINARY_FOLDER?.trim() || "memories",
  });
}
