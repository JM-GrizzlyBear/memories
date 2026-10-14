import "dotenv/config";
import path from "node:path";
import { GetAlbum } from "./application/album/GetAlbum.js";
import { SetAlbumNote } from "./application/album/SetAlbumNote.js";
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
import { GetCurrentUser } from "./application/user/GetCurrentUser.js";
import { GetProfile } from "./application/user/GetProfile.js";
import { LoginUser } from "./application/user/LoginUser.js";
import { RegisterUser } from "./application/user/RegisterUser.js";
import { RemoveProfilePhoto } from "./application/user/RemoveProfilePhoto.js";
import { SearchUsers } from "./application/user/SearchUsers.js";
import { SetProfilePhoto } from "./application/user/SetProfilePhoto.js";
import { UpdateProfile } from "./application/user/UpdateProfile.js";
import { createPool } from "./infrastructure/database/pool.js";
import { PostgresAlbumRepository } from "./infrastructure/database/PostgresAlbumRepository.js";
import { PostgresCommentRepository } from "./infrastructure/database/PostgresCommentRepository.js";
import { PostgresFriendshipRepository } from "./infrastructure/database/PostgresFriendshipRepository.js";
import { PostgresLikeRepository } from "./infrastructure/database/PostgresLikeRepository.js";
import { PostgresMemoryRepository } from "./infrastructure/database/PostgresMemoryRepository.js";
import { PostgresNotificationRepository } from "./infrastructure/database/PostgresNotificationRepository.js";
import { PostgresSessionStore } from "./infrastructure/database/PostgresSessionStore.js";
import { PostgresUserRepository } from "./infrastructure/database/PostgresUserRepository.js";
import { SocketIoPublisher } from "./infrastructure/realtime/SocketIoPublisher.js";
import { BcryptPasswordHasher } from "./infrastructure/security/BcryptPasswordHasher.js";
import {
  createPhotoStorage,
  photoStorageKind,
} from "./infrastructure/storage/createPhotoStorage.js";
import { AccountController } from "./presentation/http/account/AccountController.js";
import { AlbumController } from "./presentation/http/album/AlbumController.js";
import { createAlbumRouter } from "./presentation/http/album/albumRoutes.js";
import { createAccountRouter } from "./presentation/http/account/accountRoutes.js";
import { createApp } from "./presentation/http/app.js";
import { AuthController } from "./presentation/http/auth/AuthController.js";
import { createAuthRouter } from "./presentation/http/auth/authRoutes.js";
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

const port = Number(process.env.PORT ?? 4000);
const isProduction = process.env.NODE_ENV === "production";
const webDistDir = process.env.WEB_DIST_DIR; // set only in the Docker image
const uploadsDir = path.resolve(process.env.UPLOADS_DIR ?? "uploads");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is missing");

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) throw new Error("SESSION_SECRET is missing");

const pool = createPool(databaseUrl);
await pool.query("SELECT 1");
console.log("Connected to database");

// Infrastructure
const passwordHasher = new BcryptPasswordHasher();
const photoStorage = createPhotoStorage(process.env, uploadsDir);
if (photoStorageKind(process.env) === "cloudinary") {
  console.log("Photos are stored in Cloudinary");
} else {
  console.log(`Photos are stored in ${uploadsDir}`);
  if (isProduction) {
    console.warn(
      "Warning: photos are saved on this server's disk and are lost on every redeploy. Set PHOTO_STORAGE=cloudinary.",
    );
  }
}
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

// Auth
const authController = new AuthController(
  new RegisterUser(userRepository, passwordHasher),
  new LoginUser(userRepository, passwordHasher),
  new GetCurrentUser(userRepository),
);
const authRouter = createAuthRouter(authController);

// Your account (Settings page)
const accountController = new AccountController(
  new UpdateProfile(userRepository),
  new ChangePassword(userRepository, passwordHasher, sessionStore),
  new SetProfilePhoto(userRepository, photoStorage),
  new RemoveProfilePhoto(userRepository, photoStorage),
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
  new AcceptFriendRequest(friendshipRepository, notifier),
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
  sessionMiddleware,
  isProduction,
  uploadsDir,
  webDistDir,
});

const server = app.listen(port, () => {
  console.log(`API running on port ${port}`);
});

// Live updates (new notifications) over the same server
const io = createSocketServer(server, sessionMiddleware);
realtime.attach(io);

// Render stops old containers with SIGTERM: finish requests, close the DB, exit
process.on("SIGTERM", () => {
  console.log("Shutting down...");
  void io.close(); // closes the live connections, then the server
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
});
