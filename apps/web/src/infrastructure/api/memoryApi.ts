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
