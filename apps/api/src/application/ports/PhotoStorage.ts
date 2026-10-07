// A photo as it arrives: raw bytes plus its type
export interface PhotoUpload {
  data: Uint8Array;
  mimeType: string;
}

// Where a saved photo lives
export interface StoredPhoto {
  url: string; // what the browser loads
  storageKey: string; // what we need to delete it later
}

export interface PhotoStorage {
  save(photo: PhotoUpload): Promise<StoredPhoto>;
  delete(storageKey: string): Promise<void>;
}
