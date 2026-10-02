import { InvalidCredentialsError } from "../../domain/user/errors.js";
import { UserRepository } from "../../domain/user/UserRepository.js";
import { PasswordHasher } from "../ports/PasswordHasher.js";

export interface LoginUserInput {
  usernameOrEmail: string;
  password: string;
}

export class LoginUser {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: LoginUserInput) {
    const user = await this.findUser(input.usernameOrEmail);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  private async findUser(usernameOrEmail: string) {
    const value = usernameOrEmail.trim().toLowerCase();

    return value.includes("@")
      ? this.users.findByEmail(value)
      : this.users.findByUsername(value);
  }
}
