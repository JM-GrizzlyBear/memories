import type { Membership } from "../../domain/conversation/Conversation.js";
import type { ConversationRepository } from "../../domain/conversation/ConversationRepository.js";
import {
  CannotMessageError,
  ConversationNotFoundError,
  RequestNotAcceptedError,
} from "../../domain/conversation/errors.js";
import type { FriendshipRepository } from "../../domain/friendship/FriendshipRepository.js";
import type { User } from "../../domain/user/User.js";
import type { UserRepository } from "../../domain/user/UserRepository.js";

// The rules shared by every chat use case: who is in a chat, and who you may reach
export class MessagingAccess {
  constructor(
    readonly conversations: ConversationRepository,
    readonly users: UserRepository,
    readonly friendships: FriendshipRepository,
  ) {}

  // You're in this chat (in any folder). Strangers get "not found", never "forbidden".
  async member(conversationId: string, userId: string): Promise<Membership> {
    const membership = await this.conversations.findMembership(
      conversationId,
      userId,
    );
    if (!membership) throw new ConversationNotFoundError();
    return membership;
  }

  // You're in it AND you accepted it (so you can write, add people, rename...)
  async activeMember(conversationId: string, userId: string) {
    const membership = await this.member(conversationId, userId);
    if (membership.status !== "accepted") throw new RequestNotAcceptedError();
    return membership;
  }

  // Can `fromId` reach this person? Friends: right away. Not friends: only if
  // their setting is "Anyone", and then it arrives as a request.
  async reach(
    fromId: string,
    toId: string,
    cantMessage = "You can't message this person",
  ): Promise<{ user: User; isFriend: boolean }> {
    const user = await this.users.findById(toId);
    if (!user || user.id === fromId) throw new CannotMessageError(cantMessage);

    const isFriend = await this.friendships.areFriends(fromId, toId);
    if (!isFriend && user.messagePrivacy !== "anyone") {
      throw new CannotMessageError(cantMessage);
    }
    return { user, isFriend };
  }
}
