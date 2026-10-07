import { MEMORY_LIMITS } from "@memories/shared";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";

class UnsupportedPhotoTypeError extends Error {
  constructor() {
    super("Photos must be JPG, PNG, or WebP");
    this.name = "UnsupportedPhotoTypeError";
  }
}

const upload = multer({
  // Keep files in memory; the use case decides where they're stored
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MEMORY_LIMITS.maxPhotoBytes,
    files: MEMORY_LIMITS.maxPhotos,
    fields: 10,
  },
  fileFilter: (_req, file, callback) => {
    const allowed = (MEMORY_LIMITS.photoTypes as readonly string[]).includes(
      file.mimetype,
    );
    if (allowed) {
      callback(null, true);
    } else {
      callback(new UnsupportedPhotoTypeError());
    }
  },
});

const handleUpload = upload.array("photos", MEMORY_LIMITS.maxPhotos);

const LIMIT_MESSAGES: Record<string, string> = {
  LIMIT_FILE_SIZE: "Each photo must be 5 MB or smaller",
  LIMIT_FILE_COUNT: `Add at most ${MEMORY_LIMITS.maxPhotos} photos`,
  LIMIT_UNEXPECTED_FILE: `Add at most ${MEMORY_LIMITS.maxPhotos} photos`,
};

// Reads the multipart form; turns upload problems into friendly 400 errors
export function uploadPhotos(req: Request, res: Response, next: NextFunction) {
  handleUpload(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      res.status(400).json({
        errors: {
          photos: [LIMIT_MESSAGES[error.code] ?? "Couldn't read the photos"],
        },
      });
      return;
    }
    if (error instanceof UnsupportedPhotoTypeError) {
      res.status(400).json({ errors: { photos: [error.message] } });
      return;
    }
    if (error) {
      next(error);
      return;
    }
    next();
  });
}
