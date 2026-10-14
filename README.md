# Memories

A social photo journal where every photo keeps the story behind it.
Keep a memory (photos + why it mattered), share it with everyone, your friends, or only yourself, and let friends like and comment on it.

**Live:** https://memories-hnhf.onrender.com
(free hosting: the first visit after a quiet period can take about a minute to wake up)

---

## Features

- **Accounts**: register, log in, log out (sessions stored in Postgres)
- **Memories**: 1–10 photos, title, story, date (dd-mm-yyyy), place, and who can see it
- **Journal**: your memories and the ones you're allowed to see, newest first, with "Show older memories"
- **Memory viewer**: full-screen photo carousel with the story beside it
- **Edit and delete** your own memories (add, remove, and reorder photos)
- **Friends**: search people, send / cancel / accept / decline requests, unfriend
- **Profiles** at `/u/username`
- **Likes and comments** on any memory you can see
- **Messages**: live chats and groups (up to 57 people) with photos, edit (22 minutes), unsend, "Seen", and "typing…"
  - **Who can message me?** (Settings → Privacy): Friends or Anyone. Non-friends arrive as **requests** you accept or decline; declined chats go to the **Archive**
  - **Group roles**: admins do everything, moderators can remove members, members can chat, add people, rename and change the photo

### Who can see a memory

| Visibility | Who sees it                   |
| ---------- | ----------------------------- |
| Everyone   | Anyone who is logged in       |
| Friends    | You and your accepted friends |
| Only me    | Just you                      |

Unfriending works both ways: neither person sees the other's "Friends" memories anymore.
A pending request doesn't count as a friendship.

---

## Tech stack

| Part                       | Tools                                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| Monorepo                   | Turborepo + pnpm workspaces                                                               |
| Frontend (`apps/web`)      | React, Vite, TypeScript, Tailwind CSS v4, React Router, lucide-react                      |
| Backend (`apps/api`)       | Node.js, Express 5, TypeScript, PostgreSQL (`pg`), express-session, zod, multer, bcryptjs |
| Shared (`packages/shared`) | zod schemas used by both the frontend and the backend                                     |
| Database migrations        | dbmate (plain SQL files)                                                                  |
| Photos                     | Local folder in development, Cloudinary in production                                     |
| Hosting                    | Render (app, Docker), Neon (Postgres), Cloudinary (photos)                                |
| CI/CD                      | GitHub Actions                                                                            |

Both apps follow **Clean Architecture**: `domain` → `application` → `infrastructure` → `presentation`.

---

## Project structure

```
Memories/
├── .env.example            # copy to .env → local Postgres for docker compose
├── docker-compose.yml      # local Postgres (+ "prod" profile to test the Docker image)
├── Dockerfile              # production image used by Render
├── turbo.json              # Turborepo tasks
├── .github/workflows/
│   ├── ci.yml              # type-check + build + Docker build on every PR and on main
│   ├── deploy.yml          # manual: deploy to Render
│   └── clear-cache.yml     # weekly + manual: clear GitHub Actions caches
├── apps/
│   ├── api/                # Express API (also serves the built website in production)
│   │   ├── .env.example    # copy to apps/api/.env → the API's settings
│   │   ├── db/migrations/  # SQL migrations (dbmate)
│   │   └── src/
│   │       ├── domain/         # entities, rules, repository interfaces, errors
│   │       ├── application/    # use cases and ports (PhotoStorage, PasswordHasher)
│   │       ├── infrastructure/ # Postgres repositories, bcrypt, photo storage (local / Cloudinary)
│   │       ├── presentation/   # controllers, routes, middleware
│   │       └── main.ts         # wires everything together
│   └── web/                # React website
│       └── src/
│           ├── domain/         # types
│           ├── application/    # hooks (useJournal, useFriendship, ...)
│           ├── infrastructure/ # API calls
│           └── presentation/   # pages and components
└── packages/
    └── shared/             # zod schemas shared by api and web
```

---

## Environment files: which goes where

There are **two** `.env` files for local development, plus Render's settings for production.
`.env` files are in `.gitignore`. **Never commit them**, only the `.env.example` files.

| File                                            | Used by            | What goes in it                                  |
| ----------------------------------------------- | ------------------ | ------------------------------------------------ |
| `.env` (project root)                           | `docker compose`   | The local Postgres user, password, database name |
| `apps/api/.env`                                 | The API and dbmate | Database URL, session secret, photo storage      |
| Render → Environment                            | The live app       | Neon database, session secret, Cloudinary        |
| GitHub → Settings → Environments → `production` | Deploy workflow    | `RENDER_DEPLOY_HOOK` secret                      |

The website (`apps/web`) needs **no** `.env`: in development, Vite forwards `/api` and `/uploads` to the API on port 4000.

### Root `.env`

```bash
cp .env.example .env
```

```
POSTGRES_USER=memories
POSTGRES_PASSWORD=pick_a_password
POSTGRES_DB=memories
```

### `apps/api/.env`

```bash
cp apps/api/.env.example apps/api/.env
```

| Variable            | Required                | Example / meaning                                                                                                        |
| ------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `PORT`              | no (default 4000)       | `4000`                                                                                                                   |
| `DATABASE_URL`      | yes                     | `postgres://memories:pick_a_password@127.0.0.1:5432/memories?sslmode=disable` (same user/password/db as the root `.env`) |
| `SESSION_SECRET`    | yes                     | a long random string: `openssl rand -hex 32`                                                                             |
| `PHOTO_STORAGE`     | no (default `local`)    | `local` = `apps/api/uploads` folder, `cloudinary` = Cloudinary                                                           |
| `CLOUDINARY_URL`    | only with `cloudinary`  | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`                                                                             |
| `CLOUDINARY_FOLDER` | no (default `memories`) | folder in your Cloudinary Media Library                                                                                  |
| `UPLOADS_DIR`       | no (default `uploads`)  | where local photos go                                                                                                    |

Use `127.0.0.1` instead of `localhost` in `DATABASE_URL` on Windows if dbmate says the connection was refused on `[::1]:5432`.

---

## Run it locally

### Requirements

- Node.js 22
- pnpm (`corepack enable` turns it on; this repo pins the version in `package.json`)
- Docker Desktop (for the local Postgres)
- Git Bash on Windows (PowerShell drops the `--` used in some commands)

### Steps

```bash
# 1. Install packages
pnpm install

# 2. Create your env files (see the section above), then start Postgres
docker compose up -d db

# 3. Build the shared package and create the tables
turbo run build
turbo run db:migrate

# 4. Start the API (port 4000) and the website (port 5173)
turbo run dev
```

Open http://localhost:5173.

If `turbo` isn't installed globally, put `pnpm` in front: `pnpm turbo run dev`.

### Useful commands

| Command                                                            | What it does                                                     |
| ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `turbo run dev`                                                    | API + website with hot reload                                    |
| `turbo run build`                                                  | Build everything                                                 |
| `turbo run check-types`                                            | TypeScript checks (what CI runs)                                 |
| `turbo run db:migrate`                                             | Apply new migrations                                             |
| `turbo run db:rollback`                                            | Undo the last migration                                          |
| `pnpm turbo run db:new --filter=@memories/api -- create_something` | New migration file in `apps/api/db/migrations`                   |
| `docker compose up -d db`                                          | Start local Postgres                                             |
| `docker compose --profile prod up --build`                         | Run the production Docker image locally on http://localhost:8080 |

### Migrations

- One `-- migrate:up` and one `-- migrate:down` section per file.
- Never edit a migration that has already run on Neon. Add a new one instead.
- In production, the Docker image runs `dbmate migrate` automatically on every start.

---

## Deploying (Render + Neon + Cloudinary)

Deploys are **manual**: merging to `main` does not deploy.

### 1. Neon (database)

1. Sign up at https://neon.tech (free plan).
2. Create a project: region **AWS Asia Pacific (Singapore)**, Postgres 17.
3. **Connection details** → turn **off** connection pooling (direct connection) → copy the connection string.
   It looks like `postgresql://USER:PASSWORD@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`.
4. This becomes `DATABASE_URL` on Render. Keep `?sslmode=require` at the end.

### 2. Cloudinary (photos)

1. Sign up at https://cloudinary.com (free plan, no credit card).
2. **Settings (gear) → API Keys** → copy **API environment variable**:
   `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` (show the secret and replace the `< >` placeholders).
3. This becomes `CLOUDINARY_URL` on Render.

### 3. Render (the app)

1. Sign up at https://render.com and connect your GitHub.
2. **New → Web Service** → pick this repository.
   - Language / runtime: **Docker** (uses the `Dockerfile`)
   - Region: **Singapore**
   - Instance type: **Free**
   - Health check path: `/api/health`
   - Auto-Deploy: **Off** (we deploy with GitHub Actions)
3. **Environment** → add:

| Key                 | Value                                               |
| ------------------- | --------------------------------------------------- |
| `DATABASE_URL`      | Neon connection string (direct, `sslmode=require`)  |
| `SESSION_SECRET`    | a long random string, different from your local one |
| `PHOTO_STORAGE`     | `cloudinary`                                        |
| `CLOUDINARY_URL`    | your `cloudinary://...` value                       |
| `CLOUDINARY_FOLDER` | `memories`                                          |

`NODE_ENV=production` is already set in the `Dockerfile`, and Render provides `PORT` itself.

4. **Settings → Deploy Hook** → copy the URL (keep it secret: anyone with it can trigger a deploy).

### 4. GitHub (deploy button)

1. Repository → **Settings → Environments → New environment** → name it `production`.
2. Add an environment secret: `RENDER_DEPLOY_HOOK` = the Render deploy hook URL.

### 5. Deploy

1. Merge your PR into `main` (CI must be green).
2. GitHub → **Actions → Deploy → Run workflow** (branch `main`).
   It type-checks and builds first, then tells Render to deploy.
3. Watch Render's **Logs**. You should see `Connected to database`, `Photos are stored in Cloudinary`, and `API running on port ...`.

### Checking photos in production

- Right-click a photo → **Open image in new tab**: the address should start with `https://res.cloudinary.com/...`.
- Neon **SQL Editor**: `SELECT url FROM memory_photos ORDER BY created_at DESC LIMIT 3;`
- Restart the Render service: photos must still load afterwards.

---

## Git workflow

1. Update `main`: `git checkout main && git pull`
2. New branch for every step: `git checkout -b feat/something` (or `fix/...`, `docs/...`, `chore/...`)
3. Commit with [Conventional Commits](https://www.conventionalcommits.org/): a title like `feat: ...`, plus bullet lines for the details
4. Push and open a pull request into `main`
5. Merge **only when CI is green**
6. Deploy manually with the Deploy workflow when you're ready to release

---

## API overview

All routes start with `/api`. Everything except register, login, and health needs you to be logged in.

| Method        | Path                                    | What it does                                            |
| ------------- | --------------------------------------- | ------------------------------------------------------- |
| GET           | `/api/health`                           | Health check                                            |
| POST          | `/api/auth/register`                    | Create an account                                       |
| POST          | `/api/auth/login`                       | Log in                                                  |
| GET           | `/api/auth/me`                          | Current user                                            |
| POST          | `/api/auth/logout`                      | Log out                                                 |
| GET           | `/api/memories`                         | Journal (cursor pagination, `?authorId=` for a profile) |
| POST          | `/api/memories`                         | Keep a memory (multipart form with photos)              |
| GET           | `/api/memories/:id`                     | One memory                                              |
| PATCH         | `/api/memories/:id`                     | Edit (owner only)                                       |
| DELETE        | `/api/memories/:id`                     | Delete (owner only)                                     |
| PUT / DELETE  | `/api/memories/:id/like`                | Like / unlike                                           |
| GET / POST    | `/api/memories/:id/comments`            | List / add comments                                     |
| DELETE        | `/api/memories/:id/comments/:commentId` | Delete a comment (its author or the memory's owner)     |
| GET           | `/api/users?q=`                         | Search people                                           |
| GET           | `/api/users/:username`                  | Profile                                                 |
| GET           | `/api/friends`                          | Your friends                                            |
| GET           | `/api/friends/requests`                 | Incoming and sent requests                              |
| POST / DELETE | `/api/friends/requests/:userId`         | Send / cancel a request                                 |
| POST          | `/api/friends/requests/:userId/accept`  | Accept                                                  |
| POST          | `/api/friends/requests/:userId/decline` | Decline                                                 |
| DELETE        | `/api/friends/:userId`                  | Unfriend                                                |

A memory you can't see returns **404** (so nobody can tell whether it exists); a memory you can see but don't own returns **403** when you try to change it.

---

## Troubleshooting

| Problem                                             | Fix                                                                                                                    |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `ERR_PNPM_NO_PKG_MANIFEST` / package.json not found | You're in the wrong folder: `cd` to the project root                                                                   |
| dbmate: connection refused on `[::1]:5432`          | Start Docker Desktop and `docker compose up -d db`; use `127.0.0.1` in `DATABASE_URL`                                  |
| `Cannot find module '@memories/shared'`             | Run `turbo run build` (the shared package must be built first)                                                         |
| `PHOTO_STORAGE must be "local" or "cloudinary"`     | Fix the value in `apps/api/.env` or on Render                                                                          |
| `CLOUDINARY_URL should look like ...`               | Copy it again from Cloudinary; no `< >` left in it                                                                     |
| Photos disappear on the live site after a deploy    | `PHOTO_STORAGE` isn't `cloudinary` on Render                                                                           |
| CI fails but it works on Windows                    | File name case: Linux sees `AuthRoutes.ts` and `authRoutes.ts` as different files (`git config core.ignorecase false`) |
