import { MESSAGE_LIMITS } from "@memories/shared";
import {
  CannotMessageError,
  InvalidMessageError,
} from "../../domain/conversation/errors.js";
import type {
  PhotoStorage,
  PhotoUpload,
  StoredPhoto,
} from "../ports/PhotoStorage.js";
import type { ConversationEvents } from "./ConversationEvents.js";
import type { MessagingAccess } from "./MessagingAccess.js";

export interface SendMessageInput {
  conversationId: string;
  senderId: string;
  body: string; // already trimmed
  photos: PhotoUpload[];
}

export class SendMessage {
  constructor(
    private readonly access: MessagingAccess,
    private readonly photoStorage: PhotoStorage,
    private readonly events: ConversationEvents,
  ) {}

  async execute({ conversationId, senderId, body, photos }: SendMessageInput) {
    if (!body && photos.length === 0) {
      throw new InvalidMessageError("body", "Write something or add a photo");
    }
    if (photos.length > MESSAGE_LIMITS.maxPhotos) {
      throw new InvalidMessageError(
        "photos",
        `Add at most ${MESSAGE_LIMITS.maxPhotos} photos`,
      );
    }

    const membership = await this.access.activeMember(conversationId, senderId);
    if (membership.kind === "direct") {
      await this.checkDirectRecipient(conversationId, senderId);
    }

    const stored: StoredPhoto[] = [];
    try {
      for (const photo of photos) {
        stored.push(await this.photoStorage.save(photo));
      }
      const message = await this.access.conversations.addMessage({
        conversationId,
        senderId,
        body,
        photos: stored,
      });
      await this.events.newMessage(message);
      return message;
    } catch (error) {
      // Don't leave photos behind for a message that was never saved
      await Promise.allSettled(
        stored.map((photo) => this.photoStorage.delete(photo.storageKey)),
      );
      throw error;
    }
  }

  // The other person accepted (or was a friend when it started): fine.
  // Otherwise you may keep writing only if they're your friend now or open to anyone.
  private async checkDirectRecipient(conversationId: string, senderId: string) {
    const { conversations } = this.access;
    const otherId = (await conversations.memberIds(conversationId)).find(
      (id) => id !== senderId,
    );
    if (!otherId) throw new CannotMessageError();

    const other = await this.access.member(conversationId, otherId);
    if (other.status === "accepted") return;

    const { isFriend } = await this.access.reach(senderId, otherId);
    if (isFriend && other.status === "request") {
      await conversations.setStatus(conversationId, otherId, "accepted");
    }
  }
}
