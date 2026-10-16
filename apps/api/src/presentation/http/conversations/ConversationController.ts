import {
  addMembersSchema,
  createGroupSchema,
  messageBodySchema,
  renameGroupSchema,
  setRoleSchema,
} from "@memories/shared";
import type { Request, Response } from "express";
import { z } from "zod";
import type { ChangeMessage } from "../../../application/conversation/ChangeMessage.js";
import type { ChatInbox } from "../../../application/conversation/ChatInbox.js";
import type { ConversationQueries } from "../../../application/conversation/ConversationQueries.js";
import type { ManageGroup } from "../../../application/conversation/ManageGroup.js";
import type { SendMessage } from "../../../application/conversation/SendMessage.js";
import type { StartChat } from "../../../application/conversation/StartChat.js";
import {
  CannotMessageError,
  ConversationNotFoundError,
  InvalidMessageError,
  LeftGroupError,
  MessageNotFoundError,
  NotAllowedInGroupError,
  RequestNotAcceptedError,
} from "../../../domain/conversation/errors.js";
import { decodeCursor, encodeCursor } from "../cursor.js";
import { parseId } from "../parseId.js";

const folderSchema = z.object({
  folder: z.enum(["inbox", "requests", "archive"]).default("inbox"),
});

const searchSchema = z.object({
  q: z.string().trim().min(1, "Type a name").max(50),
});

const directSchema = z.object({ userId: z.uuid("Pick someone") });

// The errors we expect, as the right HTTP answer. false = not ours (500).
function sendKnownError(res: Response, error: unknown) {
  if (
    error instanceof ConversationNotFoundError ||
    error instanceof MessageNotFoundError
  ) {
    res.status(404).json({ error: error.message });
    return true;
  }
  if (
    error instanceof CannotMessageError ||
    error instanceof RequestNotAcceptedError ||
    error instanceof LeftGroupError ||
    error instanceof NotAllowedInGroupError
  ) {
    res.status(403).json({ error: error.message });
    return true;
  }
  if (error instanceof InvalidMessageError) {
    res.status(400).json({
      error: error.message,
      errors: { [error.field]: [error.message] },
    });
    return true;
  }
  return false;
}

function badRequest(res: Response, error: z.ZodError) {
  const fieldErrors = z.flattenError(error).fieldErrors as Record<
    string,
    string[]
  >;
  const first = Object.values(fieldErrors).flat()[0] ?? "Check what you sent";
  res.status(400).json({ error: first, errors: fieldErrors });
}

function uploadedPhotos(req: Request) {
  const files = (req.files ?? []) as Express.Multer.File[];
  return files.map((file) => ({ data: file.buffer, mimeType: file.mimetype }));
}

// Runs a handler; known errors become 4xx, anything else goes to the error handler
function handle(
  work: (req: Request, res: Response, userId: string) => Promise<void>,
) {
  return async (req: Request, res: Response) => {
    try {
      await work(req, res, req.session.userId as string);
    } catch (error) {
      if (sendKnownError(res, error)) return;
      throw error;
    }
  };
}

// The ids in the address must be real UUIDs, or nothing can match
function ids(req: Request, res: Response) {
  const conversationId = parseId(req.params.id);
  if (!conversationId) {
    res.status(404).json({ error: "Chat not found" });
    return null;
  }
  return conversationId;
}

export class ConversationController {
  constructor(
    private readonly queries: ConversationQueries,
    private readonly start: StartChat,
    private readonly send: SendMessage,
    private readonly change: ChangeMessage,
    private readonly inbox: ChatInbox,
    private readonly group: ManageGroup,
  ) {}

  /** GET /api/conversations?folder=inbox|requests|archive → 200 { conversations } */
  list = handle(async (req, res, userId) => {
    const query = folderSchema.safeParse(req.query);
    if (!query.success) return badRequest(res, query.error);
    const conversations = await this.queries.list(userId, query.data.folder);
    res.status(200).json({ conversations });
  });

  /** GET /api/conversations/counts → 200 { unread, requests } */
  counts = handle(async (_req, res, userId) => {
    res.status(200).json(await this.queries.counts(userId));
  });

  /** GET /api/conversations/people?q=ana → 200 { people } */
  people = handle(async (req, res, userId) => {
    const query = searchSchema.safeParse(req.query);
    if (!query.success) return badRequest(res, query.error);
    const people = await this.queries.searchPeople(userId, query.data.q);
    res.status(200).json({ people });
  });

  /** POST /api/conversations/direct { userId } → 200 { conversation } | 403 */
  direct = handle(async (req, res, userId) => {
    const body = directSchema.safeParse(req.body);
    if (!body.success) return badRequest(res, body.error);
    const id = await this.start.direct(userId, body.data.userId);
    res.status(200).json({ conversation: await this.queries.get(id, userId) });
  });

  /** POST /api/conversations/groups { name, memberIds } → 201 { conversation } */
  createGroup = handle(async (req, res, userId) => {
    const body = createGroupSchema.safeParse(req.body);
    if (!body.success) return badRequest(res, body.error);
    const id = await this.start.group(
      userId,
      body.data.name,
      body.data.memberIds,
    );
    res.status(201).json({ conversation: await this.queries.get(id, userId) });
  });

  /** GET /api/conversations/:id → 200 { conversation } | 404 */
  get = handle(async (req, res, userId) => {
    const id = ids(req, res);
    if (!id) return;
    res.status(200).json({ conversation: await this.queries.get(id, userId) });
  });

  /** GET /api/conversations/:id/messages?cursor= → 200 { messages, nextCursor } */
  messages = handle(async (req, res, userId) => {
    const id = ids(req, res);
    if (!id) return;
    const raw = typeof req.query.cursor === "string" ? req.query.cursor : null;
    const cursor = raw ? decodeCursor(raw) : null;
    if (raw && !cursor) {
      res.status(400).json({ error: "Invalid cursor" });
      return;
    }
    const page = await this.queries.messages(id, userId, cursor);
    res.status(200).json({
      messages: page.messages,
      nextCursor: page.next ? encodeCursor(page.next) : null,
    });
  });

  /** POST /api/conversations/:id/messages (multipart: body, photos) → 201 { message } */
  sendMessage = handle(async (req, res, userId) => {
    const id = ids(req, res);
    if (!id) return;
    const body = messageBodySchema.safeParse(req.body ?? {});
    if (!body.success) return badRequest(res, body.error);
    const message = await this.send.execute({
      conversationId: id,
      senderId: userId,
      body: body.data.body,
      photos: uploadedPhotos(req),
    });
    res.status(201).json({ message });
  });

  /** PATCH /api/conversations/:id/messages/:messageId { body } → 200 { message } */
  editMessage = handle(async (req, res, userId) => {
    const id = ids(req, res);
    const messageId = parseId(req.params.messageId);
    if (!id) return;
    if (!messageId) {
      res.status(404).json({ error: "Message not found" });
      return;
    }
    const body = messageBodySchema.safeParse(req.body);
    if (!body.success) return badRequest(res, body.error);
    const message = await this.change.edit(
      id,
      messageId,
      userId,
      body.data.body,
    );
    res.status(200).json({ message });
  });

  /** DELETE /api/conversations/:id/messages/:messageId → 200 { message } (unsent) */
  unsendMessage = handle(async (req, res, userId) => {
    const id = ids(req, res);
    const messageId = parseId(req.params.messageId);
    if (!id) return;
    if (!messageId) {
      res.status(404).json({ error: "Message not found" });
      return;
    }
    const message = await this.change.unsend(id, messageId, userId);
    res.status(200).json({ message });
  });

  /** POST /api/conversations/:id/read → 200 { lastReadAt } */
  read = handle(async (req, res, userId) => {
    const id = ids(req, res);
    if (!id) return;
    const lastReadAt = await this.inbox.markRead(id, userId);
    res.status(200).json({ lastReadAt });
  });

  /** POST /api/conversations/:id/accept → 204 */
  accept = handle(async (req, res, userId) => {
    const id = ids(req, res);
    if (!id) return;
    await this.inbox.accept(id, userId);
    res.status(204).end();
  });

  /** POST /api/conversations/:id/decline → 204 */
  decline = handle(async (req, res, userId) => {
    const id = ids(req, res);
    if (!id) return;
    await this.inbox.decline(id, userId);
    res.status(204).end();
  });

  /** PUT /api/conversations/:id/archive → 204 */
  archive = handle(async (req, res, userId) => {
    const id = ids(req, res);
    if (!id) return;
    await this.inbox.archive(id, userId, true);
    res.status(204).end();
  });

  /** DELETE /api/conversations/:id/archive → 204 */
  unarchive = handle(async (req, res, userId) => {
    const id = ids(req, res);
    if (!id) return;
    await this.inbox.archive(id, userId, false);
    res.status(204).end();
  });

  /** POST /api/conversations/:id/members { memberIds } → 204 */
  addMembers = handle(async (req, res, userId) => {
    const id = ids(req, res);
    if (!id) return;
    const body = addMembersSchema.safeParse(req.body);
    if (!body.success) return badRequest(res, body.error);
    await this.group.add(id, userId, body.data.memberIds);
    res.status(204).end();
  });

  /** DELETE /api/conversations/:id/members/:userId → 204 (your own id = leave) */
  removeMember = handle(async (req, res, userId) => {
    const id = ids(req, res);
    const targetId = parseId(req.params.userId);
    if (!id) return;
    if (!targetId) {
      res.status(404).json({ error: "They're not in this group" });
      return;
    }
    await this.group.remove(id, userId, targetId);
    res.status(204).end();
  });

  /** PUT /api/conversations/:id/members/:userId/role { role } → 204 */
  setRole = handle(async (req, res, userId) => {
    const id = ids(req, res);
    const targetId = parseId(req.params.userId);
    if (!id) return;
    if (!targetId) {
      res.status(404).json({ error: "They're not in this group" });
      return;
    }
    const body = setRoleSchema.safeParse(req.body);
    if (!body.success) return badRequest(res, body.error);
    await this.group.setRole(id, userId, targetId, body.data.role);
    res.status(204).end();
  });

  /** PATCH /api/conversations/:id { name } → 204 */
  rename = handle(async (req, res, userId) => {
    const id = ids(req, res);
    if (!id) return;
    const body = renameGroupSchema.safeParse(req.body);
    if (!body.success) return badRequest(res, body.error);
    await this.group.rename(id, userId, body.data.name);
    res.status(204).end();
  });

  /** PUT /api/conversations/:id/photo (multipart, field "photo") → 204 */
  setPhoto = handle(async (req, res, userId) => {
    const id = ids(req, res);
    if (!id) return;
    const [photo] = uploadedPhotos(req);
    if (!photo) {
      res.status(400).json({
        error: "Choose a photo",
        errors: { photo: ["Choose a photo"] },
      });
      return;
    }
    await this.group.setPhoto(id, userId, photo);
    res.status(204).end();
  });

  /** DELETE /api/conversations/:id/photo → 204 */
  removePhoto = handle(async (req, res, userId) => {
    const id = ids(req, res);
    if (!id) return;
    await this.group.setPhoto(id, userId, null);
    res.status(204).end();
  });
}
