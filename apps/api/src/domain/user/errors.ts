export class EmailAlreadyTakenError extends Error {
  constructor() {
    super("Email is already taken");
    this.name = "EmailAlreadyTakenError";
  }
}
export class UsernameAlreadyTakenError extends Error {
  constructor() {
    super("Username is already taken");
    this.name = "UsernameAlreadyTakenError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Email or password is incorrect");
    this.name = "InvalidCredentialsError";
  }
}
