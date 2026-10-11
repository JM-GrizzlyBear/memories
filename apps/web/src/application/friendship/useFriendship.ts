import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { queryKeys } from "../query/queryKeys";

const ACTIONS = {
  add: sendFriendRequest,
  cancel: cancelFriendRequest,
  accept: acceptFriendRequest,
  decline: declineFriendRequest,
  unfriend: removeFriend,
} satisfies Record<string, (userId: string) => Promise<FriendshipStatus>>;

type FriendAction = keyof typeof ACTIONS;

// How I relate to one person, and the actions that change it
export function useFriendship(userId: string, initial: FriendshipStatus) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(initial);

  const mutation = useMutation({
    mutationFn: async (action: FriendAction) => await ACTIONS[action](userId),
    onSuccess: (next) => {
      setStatus(next);
      // A friendship changes a lot: the friend lists and the header badge, profiles
      // and search results, and which "Friends" memories I can see
      void queryClient.invalidateQueries({ queryKey: queryKeys.friends });
      void queryClient.invalidateQueries({ queryKey: queryKeys.users });
      void queryClient.invalidateQueries({ queryKey: queryKeys.memories });
    },
  });

  async function run(action: FriendAction) {
    if (mutation.isPending) return;
    try {
      await mutation.mutateAsync(action);
    } catch {
      // Shown through `error` below
    }
  }

  // 404 = it changed in the meantime (they cancelled, or already unfriended)
  const error = mutation.isError
    ? mutation.error instanceof ApiError && mutation.error.status === 404
      ? "This changed in the meantime. Refresh the page to see where things stand."
      : "Something went wrong. Please try again."
    : null;

  return {
    status,
    isWorking: mutation.isPending,
    error,
    add: () => run("add"),
    cancel: () => run("cancel"),
    accept: () => run("accept"),
    decline: () => run("decline"),
    unfriend: () => run("unfriend"),
  };
}
