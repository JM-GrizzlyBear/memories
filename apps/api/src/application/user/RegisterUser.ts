import {
  EmailAlreadyTakenError,
  UsernameAlreadyTakenError,
} from "../../domain/user/errors.js";
import type { UserRepository } from "../../domain/user/UserRepository.js";
import type { PasswordHasher } from "../ports/PasswordHasher.js";

export interface RegisterUserInput {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthday: Date;
}

export class RegisterUser {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: RegisterUserInput) {
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim().toLowerCase();

    if (await this.users.findByEmail(email)) {
      throw new EmailAlreadyTakenError();
    }

    if (await this.users.findByUsername(username)) {
      throw new UsernameAlreadyTakenError();
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = await this.users.create({
      username,
      email,
      passwordHash,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      birthday: input.birthday,
      profilePhotoUrl: null,
    });

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}
