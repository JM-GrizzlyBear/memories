import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Album } from "../../domain/album";
import { ApiError } from "../../infrastructure/api/http";
import { getAlbum, saveAlbumNote } from "../../infrastructure/api/albumApi";
import { queryKeys } from "../query/queryKeys";

type Status = "loading" | "ready" | "not-found" | "error";

// Someone's album: their memories (the ones I may see) grouped by year.
// Keeping, editing or deleting a memory and friend changes refresh it by themselves.
export function useAlbum(username: string) {
  const query = useQuery({
    queryKey: queryKeys.album(username),
    queryFn: async () => await getAlbum(username),
  });

  const isNotFound =
    query.error instanceof ApiError && query.error.status === 404;

  const status: Status = isNotFound
    ? "not-found"
    : query.data
      ? "ready"
      : query.isError
        ? "error"
        : "loading";

  return {
    album: query.data ?? null,
    status,
    retry: () => void query.refetch(),
  };
}

// Write (or clear) my line about one year; the page shows it right away
export function useSaveAlbumNote(username: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ year, note }: { year: number; note: string }) =>
      await saveAlbumNote(year, note),
    onSuccess: (saved) => {
      queryClient.setQueryData<Album>(queryKeys.album(username), (album) =>
        album
          ? {
              ...album,
              years: album.years.map((page) =>
                page.year === saved.year ? { ...page, note: saved.note } : page,
              ),
            }
          : album,
      );
    },
    meta: { errorMessage: "Couldn't save your line. Try again." },
  });
}
