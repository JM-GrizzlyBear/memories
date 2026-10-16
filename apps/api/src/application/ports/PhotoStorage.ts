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

// What the photo is for: memory photos keep their shape, profile photos become small squares
export type PhotoPurpose = "memory" | "profile";

export interface PhotoStorage {
  save(photo: PhotoUpload, purpose?: PhotoPurpose): Promise<StoredPhoto>;
  delete(storageKey: string): Promise<void>;
}
