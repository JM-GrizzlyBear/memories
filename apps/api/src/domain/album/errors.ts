export class InvalidAlbumYearError extends Error {
  constructor() {
    super("That year isn't in the album");
    this.name = "InvalidAlbumYearError";
  }
}
