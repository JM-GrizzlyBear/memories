import { createMemorySchema, MEMORY_LIMITS } from "@memories/shared";
import type { Request, Response } from "express";
import { z } from "zod";
import type { CreateMemory } from "../../../application/memory/CreateMemory.js";
import type { DeleteMemory } from "../../../application/memory/DeleteMemory.js";
import type { GetMemory } from "../../../application/memory/GetMemory.js";
import type { ListJournal } from "../../../application/memory/ListJournal.js";
import type { UpdateMemory } from "../../../application/memory/UpdateMemory.js";
import {
  InvalidPhotoCountError,
  InvalidPhotoOrderError,
  MemoryNotFoundError,
  NotMemoryOwnerError,
} from "../../../domain/memory/errors.js";
import type { JournalCursor } from "../../../domain/memory/MemoryRepository.js";

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).optional(),
  cursor: z.string().optional(),
});

const cursorSchema = z.object({
  createdAt: z.string().min(1),
  id: z.uuid(),
});

const photoOrderSchema = z
  .array(
    z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("existing"), id: z.uuid() }),
      z.object({ kind: z.literal("new"), index: z.number().int().min(0) }),
    ]),
  )
  .min(1)
  .max(MEMORY_LIMITS.maxPhotos);

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

// A malformed id can't match anything, and must never reach the database as a bad UUID
function parseId(value: unknown) {
  const parsed = z.uuid().safeParse(value);
  return parsed.success ? parsed.data : null;
}

// The photo order arrives as a JSON string inside the multipart form
function parsePhotoOrder(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const parsed = photoOrderSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// Turns the errors we expect into the right HTTP answer; returns false for anything else
function sendKnownError(res: Response, error: unknown) {
  if (error instanceof MemoryNotFoundError) {
    res.status(404).json({ error: error.message });
    return true;
  }
  if (error instanceof NotMemoryOwnerError) {
    res.status(403).json({ error: error.message });
    return true;
  }
  if (
    error instanceof InvalidPhotoCountError ||
    error instanceof InvalidPhotoOrderError
  ) {
    res.status(400).json({ errors: { photos: [error.message] } });
    return true;
  }
  return false;
}

function uploadedPhotos(req: Request) {
  const files = (req.files ?? []) as Express.Multer.File[];
  return files.map((file) => ({ data: file.buffer, mimeType: file.mimetype }));
}

export class MemoryController {
  constructor(
    private readonly createMemory: CreateMemory,
    private readonly listJournal: ListJournal,
    private readonly getMemory: GetMemory,
    private readonly updateMemory: UpdateMemory,
    private readonly deleteMemory: DeleteMemory,
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

    try {
      const memory = await this.createMemory.execute({
        ...parsed.data,
        userId: req.session.userId as string, // guaranteed by requireAuth
        photos: uploadedPhotos(req),
      });
      res.status(201).json({ memory });
    } catch (error) {
      if (!sendKnownError(res, error)) throw error;
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
      viewerId: req.session.userId as string,
      limit: query.data.limit,
      after,
    });

    res.status(200).json({
      memories: page.memories,
      nextCursor: page.nextCursor ? encodeCursor(page.nextCursor) : null,
    });
  };

  /** GET /api/memories/:id → 200 | 401 | 404 */
  get = async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(404).json({ error: "Memory not found" });
      return;
    }

    try {
      const memory = await this.getMemory.execute({
        memoryId: id,
        viewerId: req.session.userId as string,
      });
      res.status(200).json({ memory });
    } catch (error) {
      if (!sendKnownError(res, error)) throw error;
    }
  };

  /** PATCH /api/memories/:id (multipart form) → 200 | 400 | 401 | 403 | 404 */
  update = async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(404).json({ error: "Memory not found" });
      return;
    }

    const parsed = createMemorySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res
        .status(400)
        .json({ errors: z.flattenError(parsed.error).fieldErrors });
      return;
    }

    const photoOrder = parsePhotoOrder(req.body?.photoOrder);
    if (!photoOrder) {
      res
        .status(400)
        .json({ errors: { photos: ["The photo list is invalid"] } });
      return;
    }

    try {
      const memory = await this.updateMemory.execute({
        ...parsed.data,
        memoryId: id,
        viewerId: req.session.userId as string,
        photoOrder,
        newPhotos: uploadedPhotos(req),
      });
      res.status(200).json({ memory });
    } catch (error) {
      if (!sendKnownError(res, error)) throw error;
    }
  };

  /** DELETE /api/memories/:id → 204 | 401 | 403 | 404 */
  remove = async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(404).json({ error: "Memory not found" });
      return;
    }

    try {
      await this.deleteMemory.execute({
        memoryId: id,
        viewerId: req.session.userId as string,
      });
      res.status(204).end();
    } catch (error) {
      if (!sendKnownError(res, error)) throw error;
    }
  };
}
