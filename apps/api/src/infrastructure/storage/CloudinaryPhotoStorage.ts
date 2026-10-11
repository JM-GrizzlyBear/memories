import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { randomUUID } from "node:crypto";
import type {
  PhotoStorage,
  PhotoUpload,
  StoredPhoto,
} from "../../application/ports/PhotoStorage.js";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder?: string; // folder inside your Cloudinary media library
}

// Reads the "API environment variable" from the Cloudinary dashboard:
// cloudinary://<api key>:<api secret>@<cloud name>
export function parseCloudinaryUrl(value: string): CloudinaryConfig {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("CLOUDINARY_URL is not a valid URL");
  }
  const apiKey = decodeURIComponent(url.username);
  const apiSecret = decodeURIComponent(url.password);
  const cloudName = url.hostname;
  if (url.protocol !== "cloudinary:" || !apiKey || !apiSecret || !cloudName) {
    throw new Error(
      "CLOUDINARY_URL should look like cloudinary://API_KEY:API_SECRET@CLOUD_NAME",
    );
  }
  return { cloudName, apiKey, apiSecret };
}

// Saves photos in Cloudinary (free plan, no credit card).
// Unlike the uploads folder, the files survive restarts and redeploys.
export class CloudinaryPhotoStorage implements PhotoStorage {
  private readonly folder: string;

  constructor(config: CloudinaryConfig) {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      secure: true, // always https links
    });
    this.folder = config.folder ?? "memories";
  }

  async save(photo: PhotoUpload): Promise<StoredPhoto> {
    if (!ALLOWED_TYPES.has(photo.mimeType)) {
      throw new Error(`Unsupported photo type: ${photo.mimeType}`);
    }

    // A random name: users can't guess other photos, and two uploads never collide
    const publicId = `${this.folder}/${randomUUID()}`;

    const uploaded = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          asset_folder: this.folder, // shows the photos in this folder in the dashboard
          resource_type: "image",
          allowed_formats: ["jpg", "png", "webp"],
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) {
            reject(new Error(error?.message ?? "Cloudinary upload failed"));
          } else {
            resolve(result);
          }
        },
      );
      stream.end(Buffer.from(photo.data));
    });

    // The link the browser loads:
    // - at most 2000px wide (phones don't download huge originals)
    // - best format and quality for each browser (f_auto, q_auto)
    // - resized copies leave out hidden data such as GPS location
    const url = cloudinary.url(uploaded.public_id, {
      secure: true,
      version: uploaded.version,
      urlAnalytics: false, // a clean link, without Cloudinary's tracking parameter
      transformation: [
        { width: 2000, crop: "limit" },
        { fetch_format: "auto", quality: "auto" },
      ],
    });

    return { storageKey: uploaded.public_id, url };
  }

  async delete(storageKey: string): Promise<void> {
    // Only ever delete inside our own folder
    if (!storageKey.startsWith(`${this.folder}/`)) return;

    const result: { result?: string } = await cloudinary.uploader.destroy(
      storageKey,
      { resource_type: "image", invalidate: true },
    );
    // "not found" is fine: the photo is already gone
    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error(
        `Cloudinary delete failed: ${result.result ?? "unknown"}`,
      );
    }
  }
}
