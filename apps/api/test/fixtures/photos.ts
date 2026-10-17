// The first bytes of each photo type: enough to pass the photo check

export const JPG_BYTES = [
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
];

export const PNG_BYTES = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export const WEBP_BYTES = [
  0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
];

// A tiny file the API accepts as a JPG upload
export const JPG = Buffer.from(JPG_BYTES);

// Something renamed to .jpg that isn't a photo at all
export const NOT_A_PHOTO = Buffer.from("MZ this is not a jpg");

export const JPG_FILE = { filename: "photo.jpg", contentType: "image/jpeg" };
