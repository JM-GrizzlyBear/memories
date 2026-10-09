export class CannotFriendYourselfError extends Error {
  constructor() {
    super("You can't add yourself as a friend");
    this.name = "CannotFriendYourselfError";
  }
}

export class FriendRequestNotFoundError extends Error {
  constructor() {
    super("Friend request not found");
    this.name = "FriendRequestNotFoundError";
  }
}

export class NotFriendsError extends Error {
  constructor() {
    super("You aren't friends");
    this.name = "NotFriendsError";
  }
}
