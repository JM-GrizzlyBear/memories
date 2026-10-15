import { MESSAGE_LIMITS } from "@memories/shared";
import type { NewMember } from "../../domain/conversation/ConversationRepository.js";
import { InvalidMessageError } from "../../domain/conversation/errors.js";
import type { ConversationEvents } from "./ConversationEvents.js";
import type { MessagingAccess } from "./MessagingAccess.js";

// Opening a chat with one person, or making a group
export class StartChat {
  constructor(
    private readonly access: MessagingAccess,
    private readonly events: ConversationEvents,
  ) {}

  // The chat you two already have, or a new empty one. It shows up in lists only
  // once something is sent, like Messenger.
  async direct(viewerId: string, otherId: string) {
    const { conversations } = this.access;
    const existing = await conversations.findDirect(viewerId, otherId);

    if (existing) {
      // Opening it yourself means you want it: take it out of requests or the archive
      const mine = await this.access.member(existing, viewerId);
      if (mine.status !== "accepted" || mine.archived) {
        await conversations.setStatus(existing, viewerId, "accepted");
      }
      return existing;
    }

    const { isFriend } = await this.access.reach(viewerId, otherId);
    return await conversations.createDirect(viewerId, {
      userId: otherId,
      status: isFriend ? "accepted" : "request",
    });
  }

  async group(viewerId: string, name: string, memberIds: string[]) {
    const ids = [...new Set(memberIds)].filter((id) => id !== viewerId);
    // 3 people or more, you included; 2 people is a direct chat
    if (ids.length + 1 < MESSAGE_LIMITS.groupMin) {
      throw new InvalidMessageError(
        "memberIds",
        `A group needs at least ${MESSAGE_LIMITS.groupMin} people, you included`,
      );
    }
    if (ids.length + 1 > MESSAGE_LIMITS.groupMax) {
      throw new InvalidMessageError(
        "memberIds",
        `A group holds up to ${MESSAGE_LIMITS.groupMax} people`,
      );
    }

    // Your friends join right away; others (open to anyone) get a request
    const members: NewMember[] = [];
    for (const id of ids) {
      const { user, isFriend } = await this.access.reach(
        viewerId,
        id,
        "One of the people you picked can't be added",
      );
      members.push({
        userId: user.id,
        status: isFriend ? "accepted" : "request",
      });
    }

    const id = await this.access.conversations.createGroup(
      viewerId,
      name.trim() || null,
      members,
    );
    const created = await this.access.conversations.addMessage({
      conversationId: id,
      senderId: viewerId,
      event: "created",
    });
    await this.events.newMessage(created);
    return id;
  }
}
