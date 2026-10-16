import { describe, expect, it } from "vitest";
import { ApiError } from "../../infrastructure/api/http";
import { errorMessage } from "./errorMessage";

describe("error messages people read", () => {
  it("are friendly for common problems", () => {
    expect(errorMessage(new ApiError(401, "Not logged in"))).toMatch(
      /session ended/,
    );
    expect(errorMessage(new ApiError(500, "boom"))).toMatch(/on our side/);
    expect(errorMessage(new TypeError("Failed to fetch"))).toMatch(
      /connection/,
    );
  });

  it("pass the server's own words through otherwise", () => {
    expect(
      errorMessage(new ApiError(403, "Only admins can change roles")),
    ).toBe("Only admins can change roles");
  });
});
