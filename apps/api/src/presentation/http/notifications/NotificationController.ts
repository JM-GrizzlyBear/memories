import type { Request, Response } from "express";
import { z } from "zod";
import type { ListNotifications } from "../../../application/notification/ListNotifications.js";
import type { ReadNotifications } from "../../../application/notification/ReadNotifications.js";
import { decodeCursor, encodeCursor } from "../cursor.js";
import { parseId } from "../parseId.js";

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export class NotificationController {
  constructor(
    private readonly listNotifications: ListNotifications,
    private readonly readNotifications: ReadNotifications,
  ) {}

  /** GET /api/notifications?limit=20&cursor=... → 200 { notifications, nextCursor } | 400 */
  list = async (req: Request, res: Response) => {
    const query = listQuerySchema.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ errors: z.flattenError(query.error).fieldErrors });
      return;
    }

    const after = query.data.cursor ? decodeCursor(query.data.cursor) : null;
    if (query.data.cursor && !after) {
      res.status(400).json({ error: "Invalid cursor" });
      return;
    }

    const page = await this.listNotifications.execute({
      recipientId: req.session.userId as string,
      limit: query.data.limit,
      after,
    });
    res.status(200).json({
      notifications: page.notifications,
      nextCursor: page.nextCursor ? encodeCursor(page.nextCursor) : null,
    });
  };

  /** GET /api/notifications/unread-count → 200 { count } */
  unreadCount = async (req: Request, res: Response) => {
    const count = await this.readNotifications.countUnread(
      req.session.userId as string,
    );
    res.status(200).json({ count });
  };

  /** POST /api/notifications/:id/read → 204 (also when it was already read, or isn't yours) */
  markRead = async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (id) {
      await this.readNotifications.markRead(req.session.userId as string, id);
    }
    res.status(204).end();
  };

  /** POST /api/notifications/read-all → 204 */
  markAllRead = async (req: Request, res: Response) => {
    await this.readNotifications.markAllRead(req.session.userId as string);
    res.status(204).end();
  };
}
