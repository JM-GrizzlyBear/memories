export class InvalidPhotoCountError extends Error {
  constructor(max: number) {
    super(`Add between 1 and ${max} photos`);
    this.name = "InvalidPhotoCountError";
  }
}
