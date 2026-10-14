// Every piece of server data the app keeps has a key (like a folder path).
// Keys that start the same can be refreshed together, e.g. queryKeys.memories
// refreshes every journal, every memory and their comments in one go.
export const queryKeys = {
  me: ["auth", "me"] as const,

  memories: ["memories"] as const,
  journals: ["memories", "journal"] as const,
  // authorId null = the whole journal; an id = one person's profile
  journal: (authorId: string | null) =>
    ["memories", "journal", authorId ?? "everyone"] as const,
  memory: (id: string) => ["memories", "detail", id] as const,
  comments: (memoryId: string) =>
    ["memories", "detail", memoryId, "comments"] as const,
  // Under "memories" too: anything that refreshes memories refreshes the albums
  albums: ["memories", "album"] as const,
  album: (username: string) =>
    ["memories", "album", username.toLowerCase()] as const,

  friends: ["friends"] as const,
  friendList: ["friends", "list"] as const,
  friendRequests: ["friends", "requests"] as const,

  users: ["users"] as const,
  profile: (username: string) =>
    ["users", "profile", username.toLowerCase()] as const,
  userSearch: (text: string) => ["users", "search", text] as const,

  notifications: ["notifications"] as const,
  notificationList: ["notifications", "list"] as const,
  unreadNotifications: ["notifications", "unread"] as const,
};
