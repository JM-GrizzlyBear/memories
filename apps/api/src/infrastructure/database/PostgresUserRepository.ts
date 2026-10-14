import type { MessagePrivacy } from "@memories/shared";
import type { Pool } from "pg";
import { UsernameAlreadyTakenError } from "../../domain/user/errors.js";
import type { User } from "../../domain/user/User.js";
import type {
  NewUser,
  ProfilePhoto,
  ProfileUpdate,
  UserRepository,
} from "../../domain/user/UserRepository.js";

interface UserRow {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  birthday: string;
  profile_photo_url: string | null;
  profile_photo_key: string | null;
  message_privacy: MessagePrivacy;
  created_at: Date;
  updated_at: Date;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    firstName: row.first_name,
    lastName: row.last_name,
    birthday: new Date(`${row.birthday}T00:00:00Z`),
    profilePhotoUrl: row.profile_photo_url,
    profilePhotoKey: row.profile_photo_key,
    messagePrivacy: row.message_privacy,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      "SELECT * FROM users WHERE id = $1",
      [id],
    );
    const row = result.rows[0];
    return row ? toUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    const row = result.rows[0];
    return row ? toUser(row) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      "SELECT * FROM users WHERE username = $1",
      [username],
    );
    const row = result.rows[0];
    return row ? toUser(row) : null;
  }

  async create(user: NewUser): Promise<User> {
    const result = await this.pool.query<UserRow>(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, birthday)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        user.username,
        user.email,
        user.passwordHash,
        user.firstName,
        user.lastName,
        user.birthday,
      ],
    );
    return toUser(result.rows[0]);
  }

  async updateProfile(id: string, update: ProfileUpdate): Promise<User> {
    try {
      const result = await this.pool.query<UserRow>(
        `UPDATE users
         SET username = $2, first_name = $3, last_name = $4, birthday = $5, updated_at = now()
         WHERE id = $1
         RETURNING *`,
        [
          id,
          update.username,
          update.firstName,
          update.lastName,
          update.birthday.toISOString().slice(0, 10), // DATE: "YYYY-MM-DD"
        ],
      );
      return toUser(result.rows[0]);
    } catch (error) {
      // Two people grabbed the same username at the same moment: the UNIQUE rule catches it
      if (isUniqueViolation(error, "users_username_key")) {
        throw new UsernameAlreadyTakenError();
      }
      throw error;
    }
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.pool.query(
      "UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1",
      [id, passwordHash],
    );
  }

  async setProfilePhoto(id: string, photo: ProfilePhoto | null): Promise<User> {
    const result = await this.pool.query<UserRow>(
      `UPDATE users
       SET profile_photo_url = $2, profile_photo_key = $3, updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, photo?.url ?? null, photo?.key ?? null],
    );
    return toUser(result.rows[0]);
  }

  async setMessagePrivacy(id: string, privacy: MessagePrivacy): Promise<User> {
    const result = await this.pool.query<UserRow>(
      `UPDATE users SET message_privacy = $2, updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, privacy],
    );
    return toUser(result.rows[0]);
  }
}

function isUniqueViolation(error: unknown, constraint: string) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505" &&
    "constraint" in error &&
    error.constraint === constraint
  );
}
``;
