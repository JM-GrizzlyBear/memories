import type { Memory, Visibility } from "../../domain/memory";
import { request } from "./http";

export interface CreateMemoryInput {
  title: string;
  story: string;
  memoryDate: string; // "2024-05-14"
  location: string;
  visibility: Visibility;
  photos: File[]; // in order; the first is the cover
}

export interface JournalPage {
  memories: Memory[];
  nextCursor: string | null; // null = no older memories
}

// One slot in the edited photo list
export type PhotoSlot =
  | { kind: "existing"; id: string }
  | { kind: "new"; file: File };

export interface UpdateMemoryInput {
  title: string;
  story: string;
  memoryDate: string;
  location: string;
  visibility: Visibility;
  photos: PhotoSlot[]; // in order; the first is the cover
}

export async function createMemory(input: CreateMemoryInput): Promise<Memory> {
  // FormData = the browser's way to send text fields and files together
  const form = new FormData();
  form.append("title", input.title);
  form.append("story", input.story);
  form.append("memoryDate", input.memoryDate);
  form.append("visibility", input.visibility);
  if (input.location.trim()) {
    form.append("location", input.location);
  }
  for (const photo of input.photos) {
    form.append("photos", photo); // same name repeated = a list on the server
  }

  const data = await request<{ memory: Memory }>("/memories", {
    method: "POST",
    body: form,
  });
  return data.memory;
}

export async function listJournal(
  cursor?: string | null,
): Promise<JournalPage> {
  const params = new URLSearchParams({ limit: "10" });
  if (cursor) {
    params.set("cursor", cursor);
  }
  return request<JournalPage>(`/memories?${params}`);
}

export async function getMemory(id: string): Promise<Memory> {
  const data = await request<{ memory: Memory }>(
    `/memories/${encodeURIComponent(id)}`,
  );
  return data.memory;
}

export async function updateMemory(
  id: string,
  input: UpdateMemoryInput,
): Promise<Memory> {
  const form = new FormData();
  form.append("title", input.title);
  form.append("story", input.story);
  form.append("memoryDate", input.memoryDate);
  form.append("visibility", input.visibility);
  form.append("location", input.location); // always sent, so clearing it removes the place

  // New files are uploaded; the order says where each one (and each kept photo) goes
  const newFiles: File[] = [];
  const order = input.photos.map((slot) =>
    slot.kind === "existing"
      ? { kind: "existing", id: slot.id }
      : { kind: "new", index: newFiles.push(slot.file) - 1 },
  );
  form.append("photoOrder", JSON.stringify(order));
  for (const file of newFiles) {
    form.append("photos", file);
  }

  const data = await request<{ memory: Memory }>(
    `/memories/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: form,
    },
  );
  return data.memory;
}

export async function deleteMemory(id: string): Promise<void> {
  await request<void>(`/memories/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
