import { useState } from "react";
import type { FriendshipStatus } from "../../domain/friendship";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  removeFriend,
  sendFriendRequest,
} from "../../infrastructure/api/friendApi";
import { ApiError } from "../../infrastructure/api/http";
import { announceFriendshipChange } from "./friendshipEvents";

// How I relate to one person, and the actions that change it
export function useFriendship(
  userId: string,
  initial: FriendshipStatus,
  onChange?: (status: FriendshipStatus) => void,
) {
  const [status, setStatus] = useState(initial);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: (id: string) => Promise<FriendshipStatus>) {
    if (isWorking) return;
    setIsWorking(true);
    setError(null);
    try {
      const next = await action(userId);
      setStatus(next);
      onChange?.(next);
      announceFriendshipChange();
    } catch (caught) {
      // 404 = it changed in the meantime (they cancelled, or already unfriended)
      setError(
        caught instanceof ApiError && caught.status === 404
          ? "This changed in the meantime. Refresh the page to see where things stand."
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  return {
    status,
    isWorking,
    error,
    add: () => run(sendFriendRequest),
    cancel: () => run(cancelFriendRequest),
    accept: () => run(acceptFriendRequest),
    decline: () => run(declineFriendRequest),
    unfriend: () => run(removeFriend),
  };
}
