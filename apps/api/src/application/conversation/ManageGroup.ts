import { MESSAGE_LIMITS, type GroupRole } from "@memories/shared";
import type {
  Membership,
  MessageEvent,
} from "../../domain/conversation/Conversation.js";
import type { NewMember } from "../../domain/conversation/ConversationRepository.js";
import {
  ConversationNotFoundError,
  InvalidMessageError,
  NotAllowedInGroupError,
} from "../../domain/conversation/errors.js";
import {
  canRemoveMember,
  canSetRoles,
} from "../../domain/conversation/rules.js";
import type { PhotoStorage, PhotoUpload } from "../ports/PhotoStorage.js";
import type { ConversationEvents } from "./ConversationEvents.js";
import type { MessagingAccess } from "./MessagingAccess.js";

const ROLE_EVENTS: Record<GroupRole, MessageEvent> = {
  admin: "role_admin",
  moderator: "role_moderator",
  member: "role_member",
};

// Everything about a group: people, roles, name and photo
export class ManageGroup {
  constructor(
    private readonly access: MessagingAccess,
    private readonly photoStorage: PhotoStorage,
    private readonly events: ConversationEvents,
  ) {}

  private get conversations() {
    return this.access.conversations;
  }

  // You're in this group and you accepted it
  private async groupMember(conversationId: string, userId: string) {
    const membership = await this.access.activeMember(conversationId, userId);
    if (membership.kind !== "group") throw new ConversationNotFoundError();
    return membership;
  }

  // A line in the chat ("Maria added Ben"), sent live to everyone
  private async say(
    conversationId: string,
    actorId: string,
    event: MessageEvent,
    targetUserId: string | null = null,
    body = "",
  ) {
    const line = await this.conversations.addMessage({
      conversationId,
      senderId: actorId,
      event,
      targetUserId,
      body,
    });
    await this.events.newMessage(line);
  }

  // Anyone in the group can add people. Your friends join right away;
  // people open to anyone get a request; the rest can't be added by you.
  async add(conversationId: string, actorId: string, memberIds: string[]) {
    await this.groupMember(conversationId, actorId);

    const current = new Set(
      (await this.conversations.get(conversationId, actorId))?.members
        .filter((member) => member.status !== "declined")
        .map((member) => member.id) ?? [],
    );
    const ids = [...new Set(memberIds)].filter((id) => !current.has(id));
    if (ids.length === 0) {
      throw new InvalidMessageError(
        "memberIds",
        "They're already in the group",
      );
    }

    const count = await this.conversations.countMembers(conversationId);
    if (count + ids.length > MESSAGE_LIMITS.groupMax) {
      throw new InvalidMessageError(
        "memberIds",
        `A group holds up to ${MESSAGE_LIMITS.groupMax} people`,
      );
    }

    const members: NewMember[] = [];
    for (const id of ids) {
      const { user, isFriend } = await this.access.reach(
        actorId,
        id,
        "Only their friends can add them",
      );
      members.push({
        userId: user.id,
        status: isFriend ? "accepted" : "request",
      });
    }

    await this.conversations.addMembers(conversationId, actorId, members);
    for (const member of members) {
      await this.say(conversationId, actorId, "added", member.userId);
    }
    await this.events.changed(conversationId);
  }

  // Admins remove anyone; moderators remove members; members can only leave
  async remove(conversationId: string, actorId: string, targetId: string) {
    if (actorId === targetId) return await this.leave(conversationId, actorId);

    const actor = await this.groupMember(conversationId, actorId);
    const target = await this.access.member(conversationId, targetId);
    if (!canRemoveMember(actor.role, target.role)) {
      throw new NotAllowedInGroupError(
        actor.role === "moderator"
          ? "Moderators can only remove members"
          : "Only admins and moderators can remove people",
      );
    }

    await this.conversations.removeMember(conversationId, targetId);
    await this.say(conversationId, actorId, "removed", targetId);
    await this.events.changed(conversationId, [targetId]);
  }

  async leave(conversationId: string, userId: string) {
    const membership = await this.access.member(conversationId, userId);
    if (membership.kind !== "group") {
      throw new NotAllowedInGroupError(
        "You can archive a chat, but not leave it",
      );
    }

    await this.conversations.removeMember(conversationId, userId);
    // Only say it when they were really in it (not someone turning down an invite)
    if (membership.status === "accepted") {
      await this.say(conversationId, userId, "left");
      await this.handOverAdmin(conversationId);
    }
    await this.events.changed(conversationId, [userId]);
  }

  // The last admin left: whoever has been in the group longest takes over.
  // The line is "sent" by the new admin, so it reads "Ana is now an admin".
  private async handOverAdmin(conversationId: string) {
    const promoted =
      await this.conversations.promoteLongestIfNoAdmin(conversationId);
    if (promoted) {
      await this.say(conversationId, promoted, "role_admin", promoted);
    }
  }

  // Only admins make admins and moderators (and take it back)
  async setRole(
    conversationId: string,
    actorId: string,
    targetId: string,
    role: GroupRole,
  ) {
    const actor = await this.groupMember(conversationId, actorId);
    if (!canSetRoles(actor.role)) {
      throw new NotAllowedInGroupError("Only admins can change roles");
    }
    if (actorId === targetId) {
      throw new NotAllowedInGroupError("You can't change your own role");
    }
    const target: Membership = await this.access.member(
      conversationId,
      targetId,
    );
    if (target.status !== "accepted") {
      throw new NotAllowedInGroupError("They haven't joined the group yet");
    }
    if (target.role === role) return;

    await this.conversations.setRole(conversationId, targetId, role);
    await this.say(conversationId, actorId, ROLE_EVENTS[role], targetId);
    await this.events.changed(conversationId);
  }

  // Anyone in the group can rename it ("" = no name, show the people's names)
  async rename(conversationId: string, actorId: string, name: string) {
    await this.groupMember(conversationId, actorId);
    await this.conversations.rename(conversationId, name || null);
    await this.say(conversationId, actorId, "renamed", null, name);
    await this.events.changed(conversationId);
  }

  // Anyone in the group can change or remove the photo
  async setPhoto(
    conversationId: string,
    actorId: string,
    photo: PhotoUpload | null,
  ) {
    await this.groupMember(conversationId, actorId);

    const stored = photo
      ? await this.photoStorage.save(photo, "profile")
      : null;
    let oldKey: string | null;
    try {
      oldKey = await this.conversations.setPhoto(conversationId, stored);
    } catch (error) {
      if (stored) await this.photoStorage.delete(stored.storageKey);
      throw error;
    }
    if (oldKey) {
      try {
        await this.photoStorage.delete(oldKey);
      } catch (error) {
        console.error("Couldn't delete the old group photo", error);
      }
    }

    await this.say(
      conversationId,
      actorId,
      stored ? "photo_changed" : "photo_removed",
    );
    await this.events.changed(conversationId);
  }
}
