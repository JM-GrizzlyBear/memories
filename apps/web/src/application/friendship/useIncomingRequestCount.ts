import { useEffect, useState } from "react";
import { listFriendRequests } from "../../infrastructure/api/friendApi";
import { onFriendshipChange } from "./friendshipEvents";

// How many people are waiting for my answer. Checked again whenever `checkAgainKey` changes
// (the header passes the current page) and right after any friendship change.
export function useIncomingRequestCount(checkAgainKey: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    function check() {
      listFriendRequests()
        .then((requests) => {
          if (!cancelled) setCount(requests.incoming.length);
        })
        .catch(() => {
          // Not important enough to show an error; keep the last count
        });
    }

    check();
    const stopListening = onFriendshipChange(check);
    return () => {
      cancelled = true;
      stopListening();
    };
  }, [checkAgainKey]);

  return count;
}
