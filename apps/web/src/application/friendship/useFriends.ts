import { useCallback, useEffect, useState } from "react";
import type { Friend, FriendRequest } from "../../domain/friendship";
import {
  listFriendRequests,
  listFriends,
} from "../../infrastructure/api/friendApi";

type Status = "loading" | "ready" | "error";

// My friends, the requests sent to me, and the requests I sent
export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [status, setStatus] = useState<Status>("loading");

  const load = useCallback(
    async (isCancelled: () => boolean = () => false) => {
      try {
        const [friendList, requests] = await Promise.all([
          listFriends(),
          listFriendRequests(),
        ]);
        if (isCancelled()) return;
        setFriends(friendList);
        setIncoming(requests.incoming);
        setOutgoing(requests.outgoing);
        setStatus("ready");
      } catch {
        if (!isCancelled()) setStatus("error");
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    load(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [load]);

  function retry() {
    setStatus("loading");
    load();
  }

  // After any accept/decline/cancel/unfriend: fetch the lists again, quietly
  const refresh = useCallback(() => {
    load();
  }, [load]);

  return { friends, incoming, outgoing, status, retry, refresh };
}
