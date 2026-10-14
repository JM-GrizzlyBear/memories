import type { Message } from "../../domain/conversation/Conversation.js";
import type { ConversationRepository } from "../../domain/conversation/ConversationRepository.js";
import type { RealtimePublisher } from "../ports/RealtimePublisher.js";

// The live events the website listens to
export const MESSAGE_EVENTS = {
  newMessage: "message:new",
  changedMessage: "message:changed",
  changedConversation: "conversation:changed",
  read: "conversation:read",
  typing: "typing",
} as const;

// Tells everyone in a chat, the moment something happens in it
export class ConversationEvents {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly realtime: RealtimePublisher,
  ) {}

  private async toMembers(
    conversationId: string,
    event: string,
    payload: unknown,
    alsoTo: string[] = [],
  ) {
    try {
      const ids = new Set([
        ...(await this.conversations.memberIds(conversationId)),
        ...alsoTo,
      ]);
      for (const id of ids) this.realtime.publish(id, event, payload);
    } catch (error) {
      // A live update failing never undoes the action itself
      console.error("Couldn't send a live chat update", error);
    }
  }

  async newMessage(message: Message) {
    await this.toMembers(message.conversationId, MESSAGE_EVENTS.newMessage, {
      conversationId: message.conversationId,
      message,
    });
  }

  async changedMessage(message: Message) {
    await this.toMembers(
      message.conversationId,
      MESSAGE_EVENTS.changedMessage,
      {
        conversationId: message.conversationId,
        message,
      },
    );
  }

  // Members, names, photos or folders changed: reload the chat.
  // `alsoTo`: people who just left or were removed, so their screen updates too
  async changed(conversationId: string, alsoTo: string[] = []) {
    await this.toMembers(
      conversationId,
      MESSAGE_EVENTS.changedConversation,
      { conversationId },
      alsoTo,
    );
  }

  // Only to one person (their other tabs): accept, decline, archive
  changedFor(userId: string, conversationId: string) {
    this.realtime.publish(userId, MESSAGE_EVENTS.changedConversation, {
      conversationId,
    });
  }

  // "Maria is typing…" to everyone else in the chat
  async typing(conversationId: string, userId: string) {
    try {
      const ids = await this.conversations.memberIds(conversationId);
      for (const id of ids) {
        if (id !== userId) {
          this.realtime.publish(id, MESSAGE_EVENTS.typing, {
            conversationId,
            userId,
          });
        }
      }
    } catch (error) {
      console.error("Couldn't send typing", error);
    }
  }

  async read(conversationId: string, userId: string, lastReadAt: Date) {
    await this.toMembers(conversationId, MESSAGE_EVENTS.read, {
      conversationId,
      userId,
      lastReadAt,
    });
  }
}
