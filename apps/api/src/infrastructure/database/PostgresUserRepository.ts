import type { Pool } from "pg";
import type { User } from "../../domain/user/User.js";
import type {
  NewUser,
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
      `INSERT INTO users (username, email, password_hash, first_name, last_name, birthday, profile_photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        user.username,
        user.email,
        user.passwordHash,
        user.firstName,
        user.lastName,
        user.birthday,
        user.profilePhotoUrl,
      ],
    );
    return toUser(result.rows[0]);
  }
}
