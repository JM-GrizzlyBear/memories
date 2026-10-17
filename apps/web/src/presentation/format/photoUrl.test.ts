import { describe, expect, it } from "vitest";
import { thumbnailUrl } from "./photoUrl";

describe("thumbnails", () => {
  it("asks Cloudinary for a smaller copy", () => {
    expect(
      thumbnailUrl(
        "https://res.cloudinary.com/demo/image/upload/v1/memories/a.jpg",
        320,
        240,
      ),
    ).toBe(
      "https://res.cloudinary.com/demo/image/upload/c_fill,g_auto,w_320,h_240,q_auto,f_auto/v1/memories/a.jpg",
    );
  });

  it("leaves other photos as they are", () => {
    expect(thumbnailUrl("/uploads/a.jpg")).toBe("/uploads/a.jpg");
  });
});
