import type { ConversationFolder } from "../../domain/conversation/Conversation.js";
import type { MessageCursor } from "../../domain/conversation/ConversationRepository.js";
import { ConversationNotFoundError } from "../../domain/conversation/errors.js";
import type { MessagingAccess } from "./MessagingAccess.js";

const LIST_LIMIT = 100;
const PAGE_SIZE = 30;
const SEARCH_LIMIT = 20;

// Everything you can read about your chats
export class ConversationQueries {
  constructor(private readonly access: MessagingAccess) {}

  async list(viewerId: string, folder: ConversationFolder) {
    return await this.access.conversations.list(viewerId, folder, LIST_LIMIT);
  }

  async get(conversationId: string, viewerId: string) {
    const conversation = await this.access.conversations.get(
      conversationId,
      viewerId,
    );
    if (!conversation) throw new ConversationNotFoundError();
    return conversation;
  }

  // Requests can be read before accepting; only replying waits
  async messages(
    conversationId: string,
    viewerId: string,
    cursor: MessageCursor | null,
  ) {
    await this.access.member(conversationId, viewerId);
    return await this.access.conversations.listMessages(
      conversationId,
      cursor,
      PAGE_SIZE,
    );
  }

  // The header badge and the Requests tab
  async counts(userId: string) {
    return await this.access.conversations.counts(userId);
  }

  // "New message" and "Add people": only the ones you're allowed to reach
  async searchPeople(viewerId: string, text: string) {
    return await this.access.conversations.searchPeople(
      viewerId,
      text.trim(),
      SEARCH_LIMIT,
    );
  }
}
