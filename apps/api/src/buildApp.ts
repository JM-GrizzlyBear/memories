import type { Pool } from "pg";
import { GetAlbum } from "./application/album/GetAlbum.js";
import { SetAlbumNote } from "./application/album/SetAlbumNote.js";
import { ChangeMessage } from "./application/conversation/ChangeMessage.js";
import { ChatInbox } from "./application/conversation/ChatInbox.js";
import { ConversationEvents } from "./application/conversation/ConversationEvents.js";
import { ConversationQueries } from "./application/conversation/ConversationQueries.js";
import { ManageGroup } from "./application/conversation/ManageGroup.js";
import { MessagingAccess } from "./application/conversation/MessagingAccess.js";
import { SendMessage } from "./application/conversation/SendMessage.js";
import { StartChat } from "./application/conversation/StartChat.js";
import { AddComment } from "./application/comment/AddComment.js";
import { DeleteComment } from "./application/comment/DeleteComment.js";
import { ListComments } from "./application/comment/ListComments.js";
import { AcceptFriendRequest } from "./application/friendship/AcceptFriendRequest.js";
import { CancelFriendRequest } from "./application/friendship/CancelFriendRequest.js";
import { DeclineFriendRequest } from "./application/friendship/DeclineFriendRequest.js";
import { ListFriendRequests } from "./application/friendship/ListFriendRequests.js";
import { ListFriends } from "./application/friendship/ListFriends.js";
import { RemoveFriend } from "./application/friendship/RemoveFriend.js";
import { SendFriendRequest } from "./application/friendship/SendFriendRequest.js";
import { LikeMemory } from "./application/like/LikeMemory.js";
import { CreateMemory } from "./application/memory/CreateMemory.js";
import { DeleteMemory } from "./application/memory/DeleteMemory.js";
import { GetMemory } from "./application/memory/GetMemory.js";
import { ListJournal } from "./application/memory/ListJournal.js";
import { MemoryAccess } from "./application/memory/MemoryAccess.js";
import { ListNotifications } from "./application/notification/ListNotifications.js";
import { Notifier } from "./application/notification/Notifier.js";
import { ReadNotifications } from "./application/notification/ReadNotifications.js";
import { UpdateMemory } from "./application/memory/UpdateMemory.js";
import { ChangePassword } from "./application/user/ChangePassword.js";
import { CheckPasswordResetLink } from "./application/user/CheckPasswordResetLink.js";
import { GetCurrentUser } from "./application/user/GetCurrentUser.js";
import { GetProfile } from "./application/user/GetProfile.js";
import { LoginUser } from "./application/user/LoginUser.js";
import { RegisterUser } from "./application/user/RegisterUser.js";
import { RemoveProfilePhoto } from "./application/user/RemoveProfilePhoto.js";
import { RequestPasswordReset } from "./application/user/RequestPasswordReset.js";
import { ResetPassword } from "./application/user/ResetPassword.js";
import { SearchUsers } from "./application/user/SearchUsers.js";
import { SetMessagePrivacy } from "./application/user/SetMessagePrivacy.js";
import { SetProfilePhoto } from "./application/user/SetProfilePhoto.js";
import { UpdateProfile } from "./application/user/UpdateProfile.js";
import { PostgresAlbumRepository } from "./infrastructure/database/PostgresAlbumRepository.js";
import { PostgresConversationRepository } from "./infrastructure/database/PostgresConversationRepository.js";
import { PostgresCommentRepository } from "./infrastructure/database/PostgresCommentRepository.js";
import { PostgresFriendshipRepository } from "./infrastructure/database/PostgresFriendshipRepository.js";
import { PostgresLikeRepository } from "./infrastructure/database/PostgresLikeRepository.js";
import { PostgresMemoryRepository } from "./infrastructure/database/PostgresMemoryRepository.js";
import { PostgresNotificationRepository } from "./infrastructure/database/PostgresNotificationRepository.js";
import { PostgresPasswordResetRepository } from "./infrastructure/database/PostgresPasswordResetRepository.js";
import { PostgresSessionStore } from "./infrastructure/database/PostgresSessionStore.js";
import { PostgresUserRepository } from "./infrastructure/database/PostgresUserRepository.js";
import { SocketIoPublisher } from "./infrastructure/realtime/SocketIoPublisher.js";
import { CryptoSecretTokens } from "./infrastructure/security/CryptoSecretTokens.js";
import { SystemClock } from "./infrastructure/time/SystemClock.js";
import { AccountController } from "./presentation/http/account/AccountController.js";
import { AlbumController } from "./presentation/http/album/AlbumController.js";
import { createAlbumRouter } from "./presentation/http/album/albumRoutes.js";
import { createAccountRouter } from "./presentation/http/account/accountRoutes.js";
import { createApp } from "./presentation/http/app.js";
import { AuthController } from "./presentation/http/auth/AuthController.js";
import { PasswordResetController } from "./presentation/http/auth/PasswordResetController.js";
import { rateLimit } from "./presentation/http/middleware/rateLimit.js";
import { createAuthRouter } from "./presentation/http/auth/authRoutes.js";
import { ConversationController } from "./presentation/http/conversations/ConversationController.js";
import { createConversationRouter } from "./presentation/http/conversations/conversationRoutes.js";
import { CommentController } from "./presentation/http/comments/CommentController.js";
import { FriendController } from "./presentation/http/friends/FriendController.js";
import { createFriendRouter } from "./presentation/http/friends/friendRoutes.js";
import { LikeController } from "./presentation/http/likes/LikeController.js";
import { MemoryController } from "./presentation/http/memories/MemoryController.js";
import { createMemoryRouter } from "./presentation/http/memories/memoryRoutes.js";
import { NotificationController } from "./presentation/http/notifications/NotificationController.js";
import { createNotificationRouter } from "./presentation/http/notifications/notificationRoutes.js";
import { createSessionMiddleware } from "./presentation/http/session.js";
import { UserController } from "./presentation/http/users/UserController.js";
import { createUserRouter } from "./presentation/http/users/userRoutes.js";
import { createSocketServer } from "./presentation/realtime/socketServer.js";
import type { AccountEmails } from "./application/ports/AccountEmails.js";
import type { Clock } from "./application/ports/Clock.js";
import type { PasswordHasher } from "./application/ports/PasswordHasher.js";
import type { PhotoStorage } from "./application/ports/PhotoStorage.js";

export interface BuildAppOptions {
  pool: Pool;
  sessionSecret: string;
  photoStorage: PhotoStorage;
  passwordHasher: PasswordHasher;
  isProduction: boolean;
  uploadsDir: string;
  // Account emails (forgot password, password changed). null: this server can't send email,
  // so "Forgot password" says it isn't available (the live site on free hosting).
  accountEmails: AccountEmails | null;
  // Where the website runs, for the links in emails (e.g. http://localhost:5173)
  appUrl: string;
  // The tests use a fake clock to make reset links expire
  clock?: Clock;
  // Forgot-password requests per visitor every 15 minutes (the tests raise it)
  forgotPasswordLimit?: number;
  // How many proxies sit in front of the API (Netlify, then Render: 2).
  // Default: 1 in production (Render alone), 0 otherwise.
  trustProxy?: number;
}

// Builds the whole app from its parts: repositories → use cases → controllers → routes.
// main.ts runs it on a real server; the integration tests run it against a test database.
export function buildApp({
  pool,
  sessionSecret,
  photoStorage,
  passwordHasher,
  isProduction,
  uploadsDir,
  accountEmails,
  appUrl,
  clock = new SystemClock(),
  forgotPasswordLimit = 5,
  trustProxy = isProduction ? 1 : 0,
}: BuildAppOptions) {
  // Infrastructure
  const userRepository = new PostgresUserRepository(pool);
  const memoryRepository = new PostgresMemoryRepository(pool);
  const friendshipRepository = new PostgresFriendshipRepository(pool);
  const likeRepository = new PostgresLikeRepository(pool);
  const commentRepository = new PostgresCommentRepository(pool);
  const sessionStore = new PostgresSessionStore(pool);
  const notificationRepository = new PostgresNotificationRepository(pool);
  const albumRepository = new PostgresAlbumRepository(pool);
  const realtime = new SocketIoPublisher();
  const notifier = new Notifier(notificationRepository, realtime);
  const memoryAccess = new MemoryAccess(memoryRepository, friendshipRepository);
  const conversationRepository = new PostgresConversationRepository(pool);
  const conversationEvents = new ConversationEvents(
    conversationRepository,
    realtime,
  );
  const messagingAccess = new MessagingAccess(
    conversationRepository,
    userRepository,
    friendshipRepository,
  );
  const chatInbox = new ChatInbox(messagingAccess, conversationEvents);

  // Auth
  const authController = new AuthController(
    new RegisterUser(userRepository, passwordHasher),
    new LoginUser(userRepository, passwordHasher),
    new GetCurrentUser(userRepository),
  );
  const passwordResetRepository = new PostgresPasswordResetRepository(pool);
  const secretTokens = new CryptoSecretTokens();
  const checkPasswordResetLink = new CheckPasswordResetLink(
    userRepository,
    passwordResetRepository,
    secretTokens,
    clock,
  );
  const passwordResetController = new PasswordResetController(
    new RequestPasswordReset(
      userRepository,
      passwordResetRepository,
      secretTokens,
      clock,
      accountEmails,
      appUrl,
    ),
    checkPasswordResetLink,
    new ResetPassword(
      checkPasswordResetLink,
      userRepository,
      passwordResetRepository,
      passwordHasher,
      sessionStore,
      clock,
      accountEmails,
    ),
    accountEmails !== null,
  );
  const authRouter = createAuthRouter(authController, passwordResetController, {
    // Stops someone filling a stranger's inbox, and guessing links
    forgotPassword: rateLimit({
      windowMs: 15 * 60 * 1000,
      max: forgotPasswordLimit,
      clock,
      message: "Too many requests. Please wait 15 minutes and try again.",
    }),
    resetPassword: rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      clock,
      message: "Too many tries. Please wait 15 minutes and try again.",
    }),
  });

  // Your account (Settings page)
  const accountController = new AccountController(
    new UpdateProfile(userRepository),
    new ChangePassword(
      userRepository,
      passwordHasher,
      sessionStore,
      clock,
      accountEmails,
    ),
    new SetProfilePhoto(userRepository, photoStorage),
    new RemoveProfilePhoto(userRepository, photoStorage),
    new SetMessagePrivacy(userRepository),
  );
  const accountRouter = createAccountRouter(accountController);

  // Memories
  const memoryController = new MemoryController(
    new CreateMemory(memoryRepository, photoStorage),
    new ListJournal(memoryRepository),
    new GetMemory(memoryAccess),
    new UpdateMemory(memoryRepository, photoStorage, memoryAccess),
    new DeleteMemory(memoryRepository, photoStorage, memoryAccess),
  );
  const likeController = new LikeController(
    new LikeMemory(memoryAccess, likeRepository, notifier),
  );
  const commentController = new CommentController(
    new ListComments(memoryAccess, commentRepository),
    new AddComment(memoryAccess, commentRepository, notifier),
    new DeleteComment(memoryAccess, commentRepository),
  );
  const memoryRouter = createMemoryRouter(
    memoryController,
    likeController,
    commentController,
  );

  // Friends
  const friendController = new FriendController(
    new ListFriends(friendshipRepository),
    new ListFriendRequests(friendshipRepository),
    new SendFriendRequest(userRepository, friendshipRepository, notifier),
    new CancelFriendRequest(friendshipRepository),
    new AcceptFriendRequest(friendshipRepository, notifier, chatInbox),
    new DeclineFriendRequest(friendshipRepository),
    new RemoveFriend(friendshipRepository),
  );
  const friendRouter = createFriendRouter(friendController);

  // People (search and profiles)
  const userController = new UserController(
    new SearchUsers(friendshipRepository),
    new GetProfile(userRepository, friendshipRepository),
  );
  const userRouter = createUserRouter(userController);

  // Album (a profile as a book, one spread per year)
  const albumController = new AlbumController(
    new GetAlbum(userRepository, albumRepository),
    new SetAlbumNote(albumRepository),
  );
  const albumRouter = createAlbumRouter(albumController);

  // Messages (chats and groups)
  const conversationController = new ConversationController(
    new ConversationQueries(messagingAccess),
    new StartChat(messagingAccess, conversationEvents),
    new SendMessage(messagingAccess, photoStorage, conversationEvents),
    new ChangeMessage(messagingAccess, photoStorage, conversationEvents),
    chatInbox,
    new ManageGroup(messagingAccess, photoStorage, conversationEvents),
  );
  const conversationRouter = createConversationRouter(conversationController);

  // Notifications
  const notificationController = new NotificationController(
    new ListNotifications(notificationRepository),
    new ReadNotifications(notificationRepository),
  );
  const notificationRouter = createNotificationRouter(notificationController);

  const sessionMiddleware = createSessionMiddleware(pool, sessionSecret);

  const app = createApp({
    authRouter,
    accountRouter,
    memoryRouter,
    friendRouter,
    userRouter,
    notificationRouter,
    albumRouter,
    conversationRouter,
    sessionMiddleware,
    trustProxy,
    uploadsDir,
  });

  return { app, sessionMiddleware, realtime, chatInbox };
}
