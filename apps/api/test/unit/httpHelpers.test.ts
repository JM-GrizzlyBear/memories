import { describe, expect, it } from "vitest";
import { parseCloudinaryUrl } from "../../src/infrastructure/storage/CloudinaryPhotoStorage.js";
import { photoStorageKind } from "../../src/infrastructure/storage/createPhotoStorage.js";
import {
  decodeCursor,
  encodeCursor,
} from "../../src/presentation/http/cursor.js";
import { detectPhotoType } from "../../src/presentation/http/middleware/photoSignature.js";
import { parseId } from "../../src/presentation/http/parseId.js";

describe("photo type from the file's first bytes", () => {
  it("recognizes JPG, PNG and WebP", () => {
    expect(detectPhotoType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(
      "image/jpeg",
    );
    expect(
      detectPhotoType(
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
    ).toBe("image/png");
    const webp = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
    ]);
    expect(detectPhotoType(webp)).toBe("image/webp");
  });

  it("rejects anything else, whatever its name says", () => {
    expect(
      detectPhotoType(new TextEncoder().encode("MZ fake.exe renamed to .jpg")),
    ).toBeNull();
  });
});

describe("pagination cursor", () => {
  it("survives a round trip", () => {
    const cursor = {
      createdAt: "2026-10-17 10:00:00.123456+00",
      id: "00000000-0000-4000-8000-000000000001",
    };
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
  });

  it("returns null for garbage instead of crashing", () => {
    expect(decodeCursor("not-a-cursor")).toBeNull();
    expect(
      decodeCursor(Buffer.from('{"id":"x"}').toString("base64url")),
    ).toBeNull();
  });
});

describe("ids in the address", () => {
  it("accepts a UUID and nothing else", () => {
    expect(parseId("00000000-0000-4000-8000-000000000001")).toBe(
      "00000000-0000-4000-8000-000000000001",
    );
    expect(parseId("1; DROP TABLE users")).toBeNull();
    expect(parseId(undefined)).toBeNull();
  });
});

describe("photo storage settings", () => {
  it("defaults to the local folder", () => {
    expect(photoStorageKind({})).toBe("local");
    expect(photoStorageKind({ PHOTO_STORAGE: "cloudinary" })).toBe(
      "cloudinary",
    );
  });

  it("refuses an unknown storage", () => {
    expect(() => photoStorageKind({ PHOTO_STORAGE: "s3" })).toThrow(
      /local.*cloudinary/,
    );
  });

  it("reads the Cloudinary URL, and explains a wrong one", () => {
    expect(parseCloudinaryUrl("cloudinary://key:secret@my-cloud")).toEqual({
      cloudName: "my-cloud",
      apiKey: "key",
      apiSecret: "secret",
    });
    expect(() =>
      parseCloudinaryUrl("cloudinary://<key>:<secret>@cloud"),
    ).toThrow();
    expect(() => parseCloudinaryUrl("https://example.com")).toThrow(
      /should look like/,
    );
  });
});
