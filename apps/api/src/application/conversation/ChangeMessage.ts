import {
  InvalidMessageError,
  MessageNotFoundError,
  NotAllowedInGroupError,
} from "../../domain/conversation/errors.js";
import {
  canEditMessage,
  canUnsendMessage,
} from "../../domain/conversation/rules.js";
import type { PhotoStorage } from "../ports/PhotoStorage.js";
import type { ConversationEvents } from "./ConversationEvents.js";
import type { MessagingAccess } from "./MessagingAccess.js";

// Editing (text only, first 22 minutes) and unsending (any time) your own messages
export class ChangeMessage {
  constructor(
    private readonly access: MessagingAccess,
    private readonly photoStorage: PhotoStorage,
    private readonly events: ConversationEvents,
  ) {}

  private async ownMessage(
    conversationId: string,
    messageId: string,
    userId: string,
  ) {
    await this.access.member(conversationId, userId);
    const message = await this.access.conversations.findMessage(
      conversationId,
      messageId,
    );
    if (!message) throw new MessageNotFoundError();
    return message;
  }

  async edit(
    conversationId: string,
    messageId: string,
    userId: string,
    body: string,
  ) {
    const message = await this.ownMessage(conversationId, messageId, userId);
    if (!canEditMessage(message, userId)) {
      throw new NotAllowedInGroupError(
        "You can only edit your own messages, within 22 minutes of sending",
      );
    }
    if (!body && message.photos.length === 0) {
      throw new InvalidMessageError(
        "body",
        "A message can't be empty. Unsend it instead.",
      );
    }
    if (body === message.body) return message;

    const edited = await this.access.conversations.editMessage(messageId, body);
    await this.events.changedMessage(edited);
    return edited;
  }

  async unsend(conversationId: string, messageId: string, userId: string) {
    const message = await this.ownMessage(conversationId, messageId, userId);
    if (!canUnsendMessage(message, userId)) {
      throw new NotAllowedInGroupError("You can only unsend your own messages");
    }

    const { message: unsent, photoKeys } =
      await this.access.conversations.unsendMessage(messageId);
    await Promise.allSettled(
      photoKeys.map((key) => this.photoStorage.delete(key)),
    );
    await this.events.changedMessage(unsent);
    return unsent;
  }
}
