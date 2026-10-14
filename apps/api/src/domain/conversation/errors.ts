// The chat doesn't exist, or you're not in it (we don't say which)
export class ConversationNotFoundError extends Error {
  constructor() {
    super("Chat not found");
    this.name = "ConversationNotFoundError";
  }
}

export class MessageNotFoundError extends Error {
  constructor() {
    super("Message not found");
    this.name = "MessageNotFoundError";
  }
}

// Their privacy setting doesn't let you message them
export class CannotMessageError extends Error {
  constructor(message = "You can't message this person") {
    super(message);
    this.name = "CannotMessageError";
  }
}

// You have to accept the request before you can write here
export class RequestNotAcceptedError extends Error {
  constructor() {
    super("Accept this chat before replying");
    this.name = "RequestNotAcceptedError";
  }
}

// Your role doesn't allow it (members removing people, etc.)
export class NotAllowedInGroupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotAllowedInGroupError";
  }
}

// Something about the request itself is wrong (too many people, empty message...)
export class InvalidMessageError extends Error {
  readonly field: string;
  constructor(field: string, message: string) {
    super(message);
    this.name = "InvalidMessageError";
    this.field = field;
  }
}
