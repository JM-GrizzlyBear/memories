import { createMemorySchema } from "@memories/shared";
import type { Request, Response } from "express";
import { z } from "zod";
import type { CreateMemory } from "../../../application/memory/CreateMemory.js";
import { InvalidPhotoCountError } from "../../../domain/memory/errors.js";

export class MemoryController {
  constructor(private readonly createMemory: CreateMemory) {}

  /** POST /api/memories (multipart form) → 201 | 400 | 401 */
  create = async (req: Request, res: Response) => {
    const parsed = createMemorySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res
        .status(400)
        .json({ errors: z.flattenError(parsed.error).fieldErrors });
      return;
    }

    const files = (req.files ?? []) as Express.Multer.File[];

    try {
      const memory = await this.createMemory.execute({
        ...parsed.data,
        userId: req.session.userId as string, // guaranteed by requireAuth
        photos: files.map((file) => ({
          data: file.buffer,
          mimeType: file.mimetype,
        })),
      });
      res.status(201).json({ memory });
    } catch (error) {
      if (error instanceof InvalidPhotoCountError) {
        res.status(400).json({ errors: { photos: [error.message] } });
        return;
      }
      throw error;
    }
  };
}
