import { friendshipStatus } from "../../domain/friendship/Friendship.js";
import type { FriendshipRepository } from "../../domain/friendship/FriendshipRepository.js";
import { UserNotFoundError } from "../../domain/user/errors.js";
import type { UserRepository } from "../../domain/user/UserRepository.js";

export interface GetProfileInput {
  viewerId: string;
  username: string;
}

export class GetProfile {
  constructor(
    private readonly users: UserRepository,
    private readonly friendships: FriendshipRepository,
  ) {}

  async execute({ viewerId, username }: GetProfileInput) {
    const user = await this.users.findByUsername(username);
    if (!user) throw new UserNotFoundError();

    const [friendship, friendCount] = await Promise.all([
      this.friendships.findBetween(viewerId, user.id),
      this.friendships.countFriends(user.id),
    ]);

    // Only public details: never the email, birthday or password hash
    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePhotoUrl: user.profilePhotoUrl,
      joinedAt: user.createdAt,
      friendCount,
      friendship: friendshipStatus(friendship, viewerId, user.id),
    };
  }
}
