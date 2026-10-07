import { createMemorySchema } from "@memories/shared";
import type { Request, Response } from "express";
import { z } from "zod";
import type { CreateMemory } from "../../../application/memory/CreateMemory.js";
import type { ListJournal } from "../../../application/memory/ListJournal.js";
import { InvalidPhotoCountError } from "../../../domain/memory/errors.js";
import type { JournalCursor } from "../../../domain/memory/MemoryRepository.js";

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).optional(),
  cursor: z.string().optional(),
});

const cursorSchema = z.object({
  createdAt: z.string().min(1),
  id: z.uuid(),
});

// The cursor travels as an opaque, URL-safe string
function encodeCursor(cursor: JournalCursor) {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeCursor(value: string): JournalCursor | null {
  try {
    const parsed = cursorSchema.safeParse(
      JSON.parse(Buffer.from(value, "base64url").toString("utf8")),
    );
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export class MemoryController {
  constructor(
    private readonly createMemory: CreateMemory,
    private readonly listJournal: ListJournal,
  ) {}

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

  /** GET /api/memories?limit=10&cursor=... → 200 | 400 | 401 */
  list = async (req: Request, res: Response) => {
    const query = listQuerySchema.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ errors: z.flattenError(query.error).fieldErrors });
      return;
    }

    let after: JournalCursor | null = null;
    if (query.data.cursor) {
      after = decodeCursor(query.data.cursor);
      if (!after) {
        res.status(400).json({ error: "Invalid cursor" });
        return;
      }
    }

    const page = await this.listJournal.execute({
      viewerId: req.session.userId as string, // guaranteed by requireAuth
      limit: query.data.limit,
      after,
    });

    res.status(200).json({
      memories: page.memories,
      nextCursor: page.nextCursor ? encodeCursor(page.nextCursor) : null,
    });
  };
}
