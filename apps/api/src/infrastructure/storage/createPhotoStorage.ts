import type { PhotoStorage } from "../../application/ports/PhotoStorage.js";
import { LocalPhotoStorage } from "./LocalPhotoStorage.js";
import { S3PhotoStorage } from "./S3PhotoStorage.js";

function required(env: NodeJS.ProcessEnv, name: string) {
  const value = env[name];
  if (!value) throw new Error(`${name} is missing (needed when PHOTO_STORAGE=s3)`);
  return value;
}

// PHOTO_STORAGE=s3 → a cloud bucket; anything else → the local uploads folder
export function createPhotoStorage(
  env: NodeJS.ProcessEnv,
  uploadsDir: string,
): PhotoStorage {
  if (env.PHOTO_STORAGE !== "s3") {
    return new LocalPhotoStorage(uploadsDir);
  }

  return new S3PhotoStorage({
    bucket: required(env, "S3_BUCKET"),
    region: env.S3_REGION ?? "auto",
    endpoint: env.S3_ENDPOINT || undefined,
    accessKeyId: required(env, "S3_ACCESS_KEY_ID"),
    secretAccessKey: required(env, "S3_SECRET_ACCESS_KEY"),
    publicUrl: required(env, "S3_PUBLIC_URL"),
  });
}
