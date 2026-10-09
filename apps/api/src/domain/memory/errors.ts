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

export class NotMemoryOwnerError extends Error {
  constructor() {
    super("Only the owner can change this memory");
    this.name = "NotMemoryOwnerError";
  }
}

export class InvalidPhotoOrderError extends Error {
  constructor(message = "The photo list is invalid") {
    super(message);
    this.name = "InvalidPhotoOrderError";
  }
}
