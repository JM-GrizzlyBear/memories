import { MEMORY_LIMITS, PROFILE_PHOTO_LIMITS } from "@memories/shared";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { detectPhotoType } from "./photoSignature.js";

class UnsupportedPhotoTypeError extends Error {
  constructor() {
    super("Photos must be JPG, PNG, or WebP");
    this.name = "UnsupportedPhotoTypeError";
  }
}

interface PhotoUploadOptions {
  field: string; // the form field the files come in
  maxFiles: number;
  maxBytes: number;
  allowedTypes: readonly string[];
  tooManyMessage: string;
}

// Builds a middleware that reads photos from a multipart form and
// turns upload problems into friendly 400 errors (keyed by the field name)
function createPhotoUpload(options: PhotoUploadOptions) {
  const upload = multer({
    // Keep files in memory; the use case decides where they're stored
    storage: multer.memoryStorage(),
    limits: {
      fileSize: options.maxBytes,
      files: options.maxFiles,
      fields: 10,
    },
    fileFilter: (_req, file, callback) => {
      if (options.allowedTypes.includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(new UnsupportedPhotoTypeError());
      }
    },
  });

  const handleUpload = upload.array(options.field, options.maxFiles);
  const sizeMb = Math.round(options.maxBytes / (1024 * 1024));
  const limitMessages: Record<string, string> = {
    LIMIT_FILE_SIZE: `Each photo must be ${sizeMb} MB or smaller`,
    LIMIT_FILE_COUNT: options.tooManyMessage,
    LIMIT_UNEXPECTED_FILE: options.tooManyMessage,
  };

  return (req: Request, res: Response, next: NextFunction) => {
    const fail = (message: string) =>
      res.status(400).json({ errors: { [options.field]: [message] } });

    handleUpload(req, res, (error: unknown) => {
      if (error instanceof multer.MulterError) {
        fail(limitMessages[error.code] ?? "Couldn't read the photos");
        return;
      }
      if (error instanceof UnsupportedPhotoTypeError) {
        fail(error.message);
        return;
      }
      if (error) {
        next(error);
        return;
      }

      // Check what each file really is, and trust that instead of what the browser said
      const files = (req.files ?? []) as Express.Multer.File[];
      for (const file of files) {
        const realType = detectPhotoType(file.buffer);
        if (!realType) {
          fail(`"${file.originalname}" isn't a JPG, PNG, or WebP photo`);
          return;
        }
        file.mimetype = realType;
      }
      next();
    });
  };
}

// "Keep a memory" and "Edit memory": up to 10 photos in the "photos" field
export const uploadPhotos = createPhotoUpload({
  field: "photos",
  maxFiles: MEMORY_LIMITS.maxPhotos,
  maxBytes: MEMORY_LIMITS.maxPhotoBytes,
  allowedTypes: MEMORY_LIMITS.photoTypes,
  tooManyMessage: `Add at most ${MEMORY_LIMITS.maxPhotos} photos`,
});

// Settings → Profile photo: one photo in the "photo" field
export const uploadProfilePhoto = createPhotoUpload({
  field: "photo",
  maxFiles: 1,
  maxBytes: PROFILE_PHOTO_LIMITS.maxBytes,
  allowedTypes: PROFILE_PHOTO_LIMITS.types,
  tooManyMessage: "Choose one photo",
});
