import type { ConversationRepository } from "../../domain/conversation/ConversationRepository.js";
import { NotAllowedInGroupError } from "../../domain/conversation/errors.js";
import type { ConversationEvents } from "./ConversationEvents.js";
import type { MessagingAccess } from "./MessagingAccess.js";

// Your own folders: seen, accept, decline, archive
export class ChatInbox {
  constructor(
    private readonly access: MessagingAccess,
    private readonly events: ConversationEvents,
  ) {}

  private get conversations(): ConversationRepository {
    return this.access.conversations;
  }

  // Requests are never marked seen: the sender keeps seeing "Sent" until you accept
  async markRead(conversationId: string, userId: string) {
    const membership = await this.access.member(conversationId, userId);
    if (membership.status !== "accepted") return null;

    const lastReadAt = await this.conversations.markRead(
      conversationId,
      userId,
    );
    await this.events.read(conversationId, userId, lastReadAt);
    return lastReadAt;
  }

  async accept(conversationId: string, userId: string) {
    const membership = await this.access.member(conversationId, userId);
    if (membership.status === "accepted") return;

    await this.conversations.setStatus(conversationId, userId, "accepted");
    if (membership.kind === "group") {
      const joined = await this.conversations.addMessage({
        conversationId,
        senderId: userId,
        event: "joined",
      });
      await this.events.newMessage(joined);
    }
    await this.events.changed(conversationId);
  }

  // Quietly into the archive: nobody else is told
  async decline(conversationId: string, userId: string) {
    const membership = await this.access.member(conversationId, userId);
    if (membership.status === "accepted") {
      throw new NotAllowedInGroupError(
        "You already accepted this chat. Archive it instead.",
      );
    }
    await this.conversations.setStatus(conversationId, userId, "declined");
    this.events.changedFor(userId, conversationId);
  }

  async archive(conversationId: string, userId: string, archived: boolean) {
    await this.access.activeMember(conversationId, userId);
    await this.conversations.setArchived(conversationId, userId, archived);
    this.events.changedFor(userId, conversationId);
  }

  // Only people who can write in the chat can be "typing"
  async typing(conversationId: string, userId: string) {
    const membership = await this.conversations.findMembership(
      conversationId,
      userId,
    );
    if (membership?.status !== "accepted") return;
    await this.events.typing(conversationId, userId);
  }

  // Two people just became friends: their waiting direct request is accepted by itself
  async acceptRequestsBetweenFriends(userA: string, userB: string) {
    try {
      const changed = await this.conversations.acceptDirectRequests(
        userA,
        userB,
      );
      for (const id of changed) await this.events.changed(id);
    } catch (error) {
      console.error(
        "Couldn't accept message requests between new friends",
        error,
      );
    }
  }
}
