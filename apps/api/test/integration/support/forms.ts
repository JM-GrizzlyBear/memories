import type { Test } from "supertest";
import type { MemoryFields } from "../../fixtures/memories.js";

// Fills a multipart request with a memory's form fields
export function withMemoryFields(request: Test, fields: Partial<MemoryFields>) {
  for (const [name, value] of Object.entries(fields)) {
    request.field(name, value);
  }
  return request;
}
