import { albumNoteSchema } from "@memories/shared";
import type { Request, Response } from "express";
import { z } from "zod";
import type { GetAlbum } from "../../../application/album/GetAlbum.js";
import type { SetAlbumNote } from "../../../application/album/SetAlbumNote.js";
import { InvalidAlbumYearError } from "../../../domain/album/errors.js";
import { UserNotFoundError } from "../../../domain/user/errors.js";

export class AlbumController {
  constructor(
    private readonly getAlbum: GetAlbum,
    private readonly setAlbumNote: SetAlbumNote,
  ) {}

  /** GET /api/album/:username → 200 { album } | 404 */
  show = async (req: Request, res: Response) => {
    const username = String(req.params.username ?? "");
    if (!username || username.length > 25) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    try {
      const album = await this.getAlbum.execute({
        viewerId: req.session.userId as string,
        username,
      });
      res.status(200).json({ album });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      throw error;
    }
  };

  /** PUT /api/album/notes/:year { note } → 200 { year, note } | 400 (your own album only) */
  saveNote = async (req: Request, res: Response) => {
    const parsed = albumNoteSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ errors: z.flattenError(parsed.error).fieldErrors });
      return;
    }

    try {
      const saved = await this.setAlbumNote.execute({
        userId: req.session.userId as string,
        year: Number(req.params.year),
        note: parsed.data.note,
      });
      res.status(200).json(saved);
    } catch (error) {
      if (error instanceof InvalidAlbumYearError) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }
  };
}
