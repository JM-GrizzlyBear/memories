import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Comment } from "../../domain/comment";
import {
  addComment,
  deleteComment,
  listComments,
} from "../../infrastructure/api/commentApi";
import { updateMemoryInCache } from "../memory/memoryCache";
import { queryKeys } from "../query/queryKeys";

type Status = "loading" | "ready" | "error";

export function useComments(memoryId: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.comments(memoryId);

  const query = useQuery({
    queryKey,
    queryFn: async () => await listComments(memoryId),
  });

  // The comment count on the memory's card changes with the list
  function changeCount(by: number) {
    updateMemoryInCache(queryClient, memoryId, (memory) => ({
      ...memory,
      commentCount: Math.max(0, memory.commentCount + by),
    }));
  }

  const addMutation = useMutation({
    mutationFn: async (body: string) => await addComment(memoryId, body),
    onSuccess: (comment) => {
      queryClient.setQueryData<Comment[]>(queryKey, (current) =>
        current ? [...current, comment] : [comment],
      );
      changeCount(1);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await deleteComment(memoryId, commentId);
      return commentId;
    },
    onSuccess: (commentId) => {
      queryClient.setQueryData<Comment[]>(queryKey, (current) =>
        current?.filter((comment) => comment.id !== commentId),
      );
      changeCount(-1);
    },
  });

  const status: Status = query.data
    ? "ready"
    : query.isError
      ? "error"
      : "loading";

  return {
    comments: query.data ?? [],
    status,
    retry: () => void query.refetch(),
    // Errors are thrown back to the form, which shows them next to the field
    add: async (body: string) => {
      await addMutation.mutateAsync(body);
    },
    remove: async (commentId: string) => {
      await removeMutation.mutateAsync(commentId);
    },
  };
}
