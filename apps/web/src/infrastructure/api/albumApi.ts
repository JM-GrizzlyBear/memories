import type { Album } from "../../domain/album";
import { request } from "./http";

export async function getAlbum(username: string): Promise<Album> {
  const data = await request<{ album: Album }>(
    `/album/${encodeURIComponent(username)}`,
  );
  return data.album;
}

// Your line about one year. "" removes it.
export async function saveAlbumNote(
  year: number,
  note: string,
): Promise<{ year: number; note: string | null }> {
  return await request<{ year: number; note: string | null }>(
    `/album/notes/${year}`,
    { method: "PUT", body: JSON.stringify({ note }) },
  );
}
