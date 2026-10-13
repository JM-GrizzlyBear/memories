import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Memory } from "../../domain/memory";
import { ApiError } from "../../infrastructure/api/http";
import {
  createMemory,
  deleteMemory,
  updateMemory,
  type CreateMemoryInput,
  type UpdateMemoryInput,
} from "../../infrastructure/api/memoryApi";
import {
  addMemoryToCache,
  removeMemoryFromCache,
  replaceMemoryInCache,
} from "./memoryCache";

// Keep a memory: it appears on top of the journal (and your profile) without reloading
export function useCreateMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateMemoryInput) => await createMemory(input),
    onSuccess: (created) => addMemoryToCache(queryClient, created),
    // The Keep dialog shows errors itself: a toast would be hidden behind the open dialog
    meta: { errorToast: false },
  });
}

// Edit a memory: every place showing it gets the new version, in the same spot
export function useUpdateMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateMemoryInput;
    }) => await updateMemory(id, input),
    onSuccess: (saved) => replaceMemoryInCache(queryClient, saved),
    meta: { errorToast: false }, // shown inside the Edit dialog
  });
}

// Delete a memory: it disappears everywhere
export function useDeleteMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memory: Memory) => {
      await deleteMemory(memory.id);
      return memory;
    },
    onSuccess: (deleted) => removeMemoryFromCache(queryClient, deleted.id),
    meta: {
      errorMessage: (error) =>
        error instanceof ApiError && error.status === 404
          ? "This memory was already deleted."
          : "Couldn't delete the memory. Try again.",
    },
  });
}
