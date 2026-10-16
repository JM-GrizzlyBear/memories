import { describe, expect, it } from "vitest";
import { canDeleteComment } from "../../src/domain/comment/rules.js";
import { canEdit, canView } from "../../src/domain/memory/visibility.js";

const OWNER = "owner";
const VIEWER = "viewer";

describe("who can see a memory", () => {
  it("the owner always sees their own memory", () => {
    for (const visibility of ["public", "friends", "private"] as const) {
      expect(canView({ userId: OWNER, visibility }, OWNER, false)).toBe(true);
    }
  });

  it("everyone sees a public memory", () => {
    expect(
      canView({ userId: OWNER, visibility: "public" }, VIEWER, false),
    ).toBe(true);
  });

  it("only friends see a friends memory", () => {
    expect(
      canView({ userId: OWNER, visibility: "friends" }, VIEWER, true),
    ).toBe(true);
    expect(
      canView({ userId: OWNER, visibility: "friends" }, VIEWER, false),
    ).toBe(false);
  });

  it("nobody else sees a private memory, not even a friend", () => {
    expect(
      canView({ userId: OWNER, visibility: "private" }, VIEWER, true),
    ).toBe(false);
  });

  it("only the owner can edit", () => {
    expect(canEdit({ userId: OWNER }, OWNER)).toBe(true);
    expect(canEdit({ userId: OWNER }, VIEWER)).toBe(false);
  });
});

describe("who can delete a comment", () => {
  const comment = {
    author: { id: "author" },
    memoryOwnerId: OWNER,
  } as Parameters<typeof canDeleteComment>[0];

  it("its author and the memory's owner", () => {
    expect(canDeleteComment(comment, "author")).toBe(true);
    expect(canDeleteComment(comment, OWNER)).toBe(true);
  });

  it("nobody else", () => {
    expect(canDeleteComment(comment, VIEWER)).toBe(false);
  });
});
