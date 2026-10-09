export class InvalidPhotoCountError extends Error {
  constructor(max: number) {
    super(`Add between 1 and ${max} photos`);
    this.name = "InvalidPhotoCountError";
  }
}

export class MemoryNotFoundError extends Error {
  constructor() {
    super("Memory not found");
    this.name = "MemoryNotFoundError";
  }
}
