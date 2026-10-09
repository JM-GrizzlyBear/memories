import type { MemoryAccess } from "./MemoryAccess.js";

export interface GetMemoryInput {
  memoryId: string;
  viewerId: string;
}

export class GetMemory {
  constructor(private readonly access: MemoryAccess) {}

  execute({ memoryId, viewerId }: GetMemoryInput) {
    return this.access.findViewable(memoryId, viewerId);
  }
}
