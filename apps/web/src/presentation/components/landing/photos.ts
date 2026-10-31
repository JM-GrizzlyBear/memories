// Free photos from Unsplash (Unsplash License: free to use, no permission needed).
// Loaded from Unsplash's image server, sized and compressed for small previews.
function unsplash(id: string, width: number) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=70`;
}

// The example photos on the landing, login and register pages
export const PHOTOS = {
  // "A tropical beach with palm trees and clear water", by Cris Tagupa
  beach: unsplash("1567335991483-fc7088c63506", 640),
  // "Red, pink, and yellow flowering plants", by Nature Uninterrupted Photography
  garden: unsplash("1532211387405-12202cb81d7b", 600),
  // Friends sitting on a wall with their arms around each other, by Duy Pham
  friends: unsplash("1529156069898-49953e39b3ac", 400),
};
