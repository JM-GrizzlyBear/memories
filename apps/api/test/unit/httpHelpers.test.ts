import { describe, expect, it } from "vitest";
import { parseCloudinaryUrl } from "../../src/infrastructure/storage/CloudinaryPhotoStorage.js";
import { photoStorageKind } from "../../src/infrastructure/storage/createPhotoStorage.js";
import {
  decodeCursor,
  encodeCursor,
} from "../../src/presentation/http/cursor.js";
import { detectPhotoType } from "../../src/presentation/http/middleware/photoSignature.js";
import { parseId } from "../../src/presentation/http/parseId.js";
import {
  JPG_BYTES,
  NOT_A_PHOTO,
  PNG_BYTES,
  WEBP_BYTES,
} from "../fixtures/photos.js";

describe("photo type from the file's first bytes", () => {
  it("recognizes JPG, PNG and WebP", () => {
    expect(detectPhotoType(new Uint8Array(JPG_BYTES))).toBe("image/jpeg");
    expect(detectPhotoType(new Uint8Array(PNG_BYTES))).toBe("image/png");
    expect(detectPhotoType(new Uint8Array(WEBP_BYTES))).toBe("image/webp");
  });

  it("rejects anything else, whatever its name says", () => {
    expect(detectPhotoType(new Uint8Array(NOT_A_PHOTO))).toBeNull();
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
