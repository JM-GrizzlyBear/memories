import type { Request, Response } from "express";
import type { AcceptFriendRequest } from "../../../application/friendship/AcceptFriendRequest.js";
import type { CancelFriendRequest } from "../../../application/friendship/CancelFriendRequest.js";
import type { DeclineFriendRequest } from "../../../application/friendship/DeclineFriendRequest.js";
import type { ListFriendRequests } from "../../../application/friendship/ListFriendRequests.js";
import type { ListFriends } from "../../../application/friendship/ListFriends.js";
import type { RemoveFriend } from "../../../application/friendship/RemoveFriend.js";
import type { SendFriendRequest } from "../../../application/friendship/SendFriendRequest.js";
import {
  CannotFriendYourselfError,
  FriendRequestNotFoundError,
  NotFriendsError,
} from "../../../domain/friendship/errors.js";
import { UserNotFoundError } from "../../../domain/user/errors.js";
import { parseId } from "../parseId.js";

function sendKnownError(res: Response, error: unknown) {
  if (
    error instanceof UserNotFoundError ||
    error instanceof FriendRequestNotFoundError ||
    error instanceof NotFriendsError
  ) {
    res.status(404).json({ error: error.message });
    return true;
  }
  if (error instanceof CannotFriendYourselfError) {
    res.status(400).json({ error: error.message });
    return true;
  }
  return false;
}

export class FriendController {
  constructor(
    private readonly listFriends: ListFriends,
    private readonly listFriendRequests: ListFriendRequests,
    private readonly sendFriendRequest: SendFriendRequest,
    private readonly cancelFriendRequest: CancelFriendRequest,
    private readonly acceptFriendRequest: AcceptFriendRequest,
    private readonly declineFriendRequest: DeclineFriendRequest,
    private readonly removeFriend: RemoveFriend,
  ) {}

  // Every action below needs the other person's id from the URL
  private async withOtherUser(
    req: Request,
    res: Response,
    action: (userId: string, otherId: string) => Promise<void>,
  ) {
    const otherId = parseId(req.params.userId);
    if (!otherId) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    try {
      await action(req.session.userId as string, otherId);
    } catch (error) {
      if (!sendKnownError(res, error)) throw error;
    }
  }

  /** GET /api/friends → 200 */
  list = async (req: Request, res: Response) => {
    const friends = await this.listFriends.execute(
      req.session.userId as string,
    );
    res.status(200).json({ friends });
  };

  /** GET /api/friends/requests → 200 { incoming, outgoing } */
  requests = async (req: Request, res: Response) => {
    const requests = await this.listFriendRequests.execute(
      req.session.userId as string,
    );
    res.status(200).json(requests);
  };

  /** POST /api/friends/requests/:userId → 200 { friendship } | 400 | 404 */
  send = (req: Request, res: Response) =>
    this.withOtherUser(req, res, async (userId, targetId) => {
      const friendship = await this.sendFriendRequest.execute({
        userId,
        targetId,
      });
      res.status(200).json({ friendship });
    });

  /** DELETE /api/friends/requests/:userId → 200 { friendship } | 404 */
  cancel = (req: Request, res: Response) =>
    this.withOtherUser(req, res, async (userId, targetId) => {
      await this.cancelFriendRequest.execute({ userId, targetId });
      res.status(200).json({ friendship: "none" });
    });

  /** POST /api/friends/requests/:userId/accept → 200 { friendship } | 404 */
  accept = (req: Request, res: Response) =>
    this.withOtherUser(req, res, async (userId, requesterId) => {
      await this.acceptFriendRequest.execute({ userId, requesterId });
      res.status(200).json({ friendship: "friends" });
    });

  /** POST /api/friends/requests/:userId/decline → 200 { friendship } | 404 */
  decline = (req: Request, res: Response) =>
    this.withOtherUser(req, res, async (userId, requesterId) => {
      await this.declineFriendRequest.execute({ userId, requesterId });
      res.status(200).json({ friendship: "none" });
    });

  /** DELETE /api/friends/:userId → 200 { friendship } | 404 */
  remove = (req: Request, res: Response) =>
    this.withOtherUser(req, res, async (userId, friendId) => {
      await this.removeFriend.execute({ userId, friendId });
      res.status(200).json({ friendship: "none" });
    });
}
