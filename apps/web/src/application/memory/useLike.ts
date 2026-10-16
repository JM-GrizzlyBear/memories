import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Memory } from "../../domain/memory";
import { ApiError } from "../../infrastructure/api/http";
import { setLiked } from "../../infrastructure/api/memoryApi";
import { queryKeys } from "../query/queryKeys";
import { updateMemoryInCache } from "./memoryCache";

function withLike(memory: Memory, liked: boolean): Memory {
  if (memory.likedByMe === liked) return memory;
  return {
    ...memory,
    likedByMe: liked,
    likeCount: Math.max(0, memory.likeCount + (liked ? 1 : -1)),
  };
}

// Liking feels instant: the heart fills first (everywhere the memory is shown),
// then the server confirms, or we undo it (and an error toast says so)
export function useLike(
  memory: Pick<Memory, "id" | "likedByMe" | "likeCount">,
) {
  const queryClient = useQueryClient();
  const mutationKey = ["like", memory.id];

  const mutation = useMutation({
    mutationKey,
    // Clicks on the same memory reach the server one at a time, in click order
    scope: { id: `like-${memory.id}` },
    mutationFn: async (liked: boolean) => await setLiked(memory.id, liked),
    meta: {
      errorMessage: (error) =>
        error instanceof ApiError && error.status === 404
          ? null // the usual "isn't available anymore"
          : "Couldn't save your like. Try again.",
    },
    onMutate: async (liked) => {
      // A refresh arriving now would put the old heart back
      await queryClient.cancelQueries({ queryKey: queryKeys.memories });
      updateMemoryInCache(queryClient, memory.id, (current) =>
        withLike(current, liked),
      );
    },
    onError: (_error, liked) => {
      updateMemoryInCache(queryClient, memory.id, (current) =>
        withLike(current, !liked),
      );
    },
    onSuccess: (result) => {
      // More clicks still on their way? The last one decides what's shown.
      if (queryClient.isMutating({ mutationKey }) > 1) return;
      updateMemoryInCache(queryClient, memory.id, (current) => ({
        ...current,
        ...result,
      }));
    },
  });

  return {
    likedByMe: memory.likedByMe,
    likeCount: memory.likeCount,
    toggle: () => mutation.mutate(!memory.likedByMe),
  };
}
