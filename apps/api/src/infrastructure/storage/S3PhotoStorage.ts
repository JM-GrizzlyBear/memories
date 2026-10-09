import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
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

export interface S3PhotoStorageConfig {
  bucket: string;
  region: string; // "auto" for Cloudflare R2
  endpoint?: string; // R2: https://<account id>.r2.cloudflarestorage.com
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl: string; // where browsers load the files, e.g. https://pub-xxxx.r2.dev
  prefix?: string; // folder inside the bucket
}

// Saves photos in any S3-compatible bucket (Cloudflare R2, AWS S3, Supabase Storage, MinIO).
// Unlike the uploads folder, the files survive restarts and redeploys.
export class S3PhotoStorage implements PhotoStorage {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly prefix: string;

  constructor(config: S3PhotoStorageConfig) {
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: Boolean(config.endpoint), // most non-AWS services want bucket in the path
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    this.bucket = config.bucket;
    this.publicUrl = config.publicUrl.replace(/\/+$/, ""); // no trailing slash
    this.prefix = config.prefix ?? "photos";
  }

  async save(photo: PhotoUpload): Promise<StoredPhoto> {
    const extension = EXTENSIONS[photo.mimeType];
    if (!extension) {
      throw new Error(`Unsupported photo type: ${photo.mimeType}`);
    }

    // A random name: users can't guess other photos, and two uploads never collide
    const storageKey = `${this.prefix}/${randomUUID()}${extension}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: photo.data,
        ContentType: photo.mimeType,
        // The name never changes, so browsers may keep it for a year
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    return { storageKey, url: `${this.publicUrl}/${storageKey}` };
  }

  async delete(storageKey: string): Promise<void> {
    // Only ever delete inside our own folder
    if (!storageKey.startsWith(`${this.prefix}/`)) return;
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }),
    );
  }
}
