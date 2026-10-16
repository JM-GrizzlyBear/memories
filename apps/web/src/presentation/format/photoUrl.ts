// A smaller copy of a photo for thumbnails. Cloudinary makes it on the fly when the
// size is written in the address; photos stored anywhere else are used as they are.
export function thumbnailUrl(url: string, width = 480, height = 360) {
  const marker = "/image/upload/";
  if (!url.includes("res.cloudinary.com") || !url.includes(marker)) return url;
  return url.replace(
    marker,
    `${marker}c_fill,g_auto,w_${width},h_${height},q_auto,f_auto/`,
  );
}
