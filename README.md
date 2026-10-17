# Memories

A social photo journal where every photo keeps the story behind it.
Keep a memory (photos + why it mattered), share it with everyone, your friends, or only yourself, let friends like and comment on it, look back through your album year by year, and chat with friends.

---

## Features

- **Accounts**: register, log in, log out (sessions stored in Postgres)
- **Settings**: change your photo, name, username, birthday and password, and who can message you
- **Memories**: 1–10 photos, title, story, date (dd-mm-yyyy), place, and who can see it
- **Journal**: your memories and the ones you're allowed to see, newest first, with "Show older memories"
- **Memory viewer**: full-screen photo carousel with the story beside it
- **Edit and delete** your own memories (add, remove, and reorder photos)
- **Friends**: search people, send / cancel / accept / decline requests, unfriend
- **Profiles** at `/u/username`, with a **Memories** tab and an **Album** tab
- **Album**: your memories as a book, one page per year, with a line you can write about each year
- **Likes and comments** on any memory you can see
- **Notifications**: live (no refresh) for likes, comments and friend requests, with a bell and toasts
- **Messages**: live chats and groups with photos, edit (22 minutes), unsend, "Seen", and "typing…"
  - **Who can message me?** (Settings → Privacy): Friends or Anyone. Non-friends arrive as **requests** you accept or decline; declined chats go to the **Archive**
  - **Groups** start with 3 to 57 people and stay a group even if people leave
  - **Leaving a group** keeps it in your chats with "You left the group" (or "removed you"), readable up to that moment, like Messenger
  - **Group roles**: admins do everything, moderators can remove members, members can chat, add people, rename and change the photo
  - **Chat windows** at the bottom right (like Messenger on Facebook) that stay open while you move around the app

### Who can see a memory

| Visibility | Who sees it                   |
| ---------- | ----------------------------- |
| Everyone   | Anyone who is logged in       |
| Friends    | You and your accepted friends |
| Only me    | Just you                      |

Unfriending works both ways: neither person sees the other's "Friends" memories anymore.
A pending request doesn't count as a friendship.

### Who can message you

| Your setting | Friends                    | Not friends                                                 |
| ------------ | -------------------------- | ----------------------------------------------------------- |
| Friends      | Can message you right away | No Message button; can't add you to groups                  |
| Anyone       | Can message you right away | Their first message arrives as a request you accept/decline |

---

## Tech stack

| Part                       | Tools                                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| Monorepo                   | Turborepo + pnpm workspaces                                                                          |
| Frontend (`apps/web`)      | React, Vite, TypeScript, Tailwind CSS v4, React Router, TanStack Query, Socket.IO client, sonner     |
| Backend (`apps/api`)       | Node.js, Express 5, TypeScript, PostgreSQL (`pg`), express-session, Socket.IO, zod, multer, bcryptjs |
| Shared (`packages/shared`) | zod schemas and limits used by both the frontend and the backend                                     |
| Database migrations        | dbmate (plain SQL files)                                                                             |
| Photos                     | Local folder in development, Cloudinary in production                                                |
| Hosting                    | Render (app, Docker), Neon (Postgres), Cloudinary (photos)                                           |
| CI/CD                      | GitHub Actions                                                                                       |

Both apps follow **Clean Architecture**: `domain` → `application` → `infrastructure` → `presentation`.

---

## Project structure

```
Memories/
├── .dockerignore            # what the Docker build leaves out (node_modules, .env, ...)
├── .env.example             # copy to .env → local Postgres for docker compose
├── .gitignore
├── docker-compose.yml       # local Postgres (+ "prod" profile to test the Docker image)
├── Dockerfile               # production image used by Render
├── package.json             # root scripts and the pinned pnpm version
├── pnpm-workspace.yaml      # the workspace: apps/* and packages/*
├── pnpm-lock.yaml           # exact package versions (commit it, don't edit it)
├── turbo.json               # Turborepo tasks: build, dev, check-types, test, db:*
├── .github/workflows/
│   ├── ci.yml               # type-check + build + tests + Docker build on every PR and on main
│   ├── deploy.yml           # manual: deploy to Render
│   └── clear-cache.yml      # weekly + manual: clear GitHub Actions caches
├── apps/
│   ├── api/                 # Express API (also serves the built website in production)
│   │   ├── .env.example     # copy to apps/api/.env → the API's settings
│   │   ├── db/migrations/   # SQL migrations (dbmate), run in order by their date prefix
│   │   ├── vitest.config.ts # two test projects: unit and integration
│   │   ├── test/
│   │   │   ├── fixtures/            # test data: photos, users, memories, messages
│   │   │   ├── unit/                # rules and helpers, no database
│   │   │   └── integration/         # real HTTP requests against a test database
│   │   │       └── support/         # test DB setup, seed data, logged-in test clients
│   │   └── src/
│   │       ├── domain/              # entities, rules, repository interfaces, errors
│   │       │   ├── album/  comment/  conversation/  friendship/
│   │       │   └── like/   memory/   notification/  user/
│   │       ├── application/         # use cases, one folder per feature
│   │       │   ├── album/  comment/  conversation/  friendship/  like/
│   │       │   ├── memory/  notification/  user/
│   │       │   └── ports/           # interfaces: PhotoStorage, PasswordHasher, RealtimePublisher, SessionStore
│   │       ├── infrastructure/
│   │       │   ├── database/        # Postgres repositories + connection pool
│   │       │   ├── realtime/        # Socket.IO publisher
│   │       │   ├── security/        # bcrypt
│   │       │   └── storage/         # photo storage: local folder or Cloudinary
│   │       ├── presentation/
│   │       │   ├── http/            # controllers + routes per feature, middleware, error handler
│   │       │   └── realtime/        # Socket.IO server (login cookie, typing)
│   │       ├── buildApp.ts          # wires everything together (also used by the tests)
│   │       └── main.ts              # reads the env, starts the server
│   └── web/                 # React website (Vite)
│       ├── index.html
│       ├── vite.config.ts   # dev server: forwards /api, /uploads and /socket.io to the API
│       ├── public/          # favicon and icons
│       └── src/
│           ├── domain/              # types (album, comment, conversation, friendship, memory, ...)
│           ├── application/         # hooks per feature (TanStack Query), auth, live updates
│           │   ├── account/  album/  auth/  comment/  common/  conversation/
│           │   ├── friendship/  memory/  notification/  query/  realtime/  user/
│           ├── infrastructure/
│           │   ├── api/             # one file of API calls per feature + http.ts
│           │   └── realtime/        # the Socket.IO connection
│           ├── presentation/
│           │   ├── components/      # album/ comment/ friendship/ layout/ memory/ messages/
│           │   │                    # notification/ routing/ settings/ ui/ user/
│           │   ├── format/          # text helpers: dates, chat text, errors, photo URLs (+ their *.test.ts)
│           │   └── pages/           # one file per page (Journal, Friends, Messages, Profile, ...)
│           ├── test/fixtures/       # test data for the website's tests
│           ├── App.tsx              # routes
│           ├── main.tsx             # React, TanStack Query, auth and toasts start here
│           └── index.css            # Tailwind and the app's colors and fonts
└── packages/
    └── shared/              # zod schemas and limits shared by api and web
        └── src/             # album/ auth/ comments/ memories/ messages/ + index.ts
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

The website (`apps/web`) needs **no** `.env`: in development, Vite forwards `/api`, `/uploads` and `/socket.io` to the API on port 4000.

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
- Turborepo installed globally: `pnpm add -g turbo`
- Docker Desktop (for the local Postgres)
- Git Bash on Windows (PowerShell drops the `--` used in some commands)

`pnpm` is only for installing packages. Everything else runs with `turbo run …`.

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

`turbo run dev` shows each app in its own panel: use the ↑ / ↓ keys to switch between `@memories/web#dev` and `@memories/api#dev` (the API's errors are only in its own panel).

### After pulling new code

```bash
git pull
pnpm install          # only if package.json changed
turbo run db:migrate  # new migrations (safe to run any time; it skips the ones already done)
turbo run dev
```

### Testing with two accounts

All tabs of one browser share one login. To test as two people at once (chats, friend requests), use a **normal window and an incognito window**, or two different browsers. Check who you are with the avatar menu (top right): it shows your name and `@username`.

### Useful commands

| Command                                                       | What it does                                                     |
| ------------------------------------------------------------- | ---------------------------------------------------------------- |
| `turbo run dev`                                               | API + website with hot reload                                    |
| `turbo run build`                                             | Build everything                                                 |
| `turbo run check-types`                                       | TypeScript checks (what CI runs)                                 |
| `turbo run test`                                              | All tests (API unit + integration, website unit)                 |
| `turbo run test:unit`                                         | API unit tests only (no database needed)                         |
| `turbo run test:integration`                                  | API integration tests only (needs Postgres running)              |
| `turbo run db:migrate`                                        | Apply new migrations                                             |
| `turbo run db:rollback`                                       | Undo the last migration                                          |
| `turbo run db:new --filter=@memories/api -- create_something` | New migration file in `apps/api/db/migrations`                   |
| `docker compose up -d db`                                     | Start local Postgres                                             |
| `docker compose --profile prod up --build`                    | Run the production Docker image locally on http://localhost:8080 |

### Migrations

- One `-- migrate:up` and one `-- migrate:down` section per file.
- Never edit a migration that has already run on Neon. Add a new one instead.
- In production, the Docker image runs `dbmate migrate` automatically on every start.
- A 500 error right after pulling usually means a migration hasn't run yet: `turbo run db:migrate`.

---

## Tests

Tests use [Vitest](https://vitest.dev). The integration tests send real HTTP requests with [supertest](https://github.com/ladjs/supertest).

```bash
docker compose up -d db        # integration tests need Postgres
turbo run test                 # everything
turbo run test:unit            # API unit tests only, no database
turbo run test:integration     # API integration tests only
```

| Suite           | Where                                        | What it checks                                                                                                     |
| --------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| API unit        | `apps/api/test/unit`                         | Who can view/edit a memory, group roles, the 22-minute edit window, photo type detection, Cloudinary URLs, cursors |
| API integration | `apps/api/test/integration`                  | Auth, memories and visibility, likes, comments, notifications, friends, album, messages, requests, groups          |
| Website unit    | `apps/web/src/presentation/format/*.test.ts` | Date, chat text, error message and photo URL helpers                                                               |

### The test database

The integration tests **never touch your real data**. They use a separate database:

- The name is your `DATABASE_URL` database plus `_test` (for example `memories` → `memories_test`), or `TEST_DATABASE_URL` if you set it.
- Before the tests run, dbmate creates that database (if needed) and applies every migration.
- **Before every single test**, all tables are emptied and the same seed data is inserted again, so each test starts from the exact same state no matter what the previous test did.
- As a safety guard, the tests refuse to run unless the database name ends in `_test`.

Seed data (password `password123` for everyone):

| Username | Friends with |
| -------- | ------------ |
| `maria`  | ana, ben     |
| `ana`    | maria        |
| `ben`    | maria        |
| `cara`   | nobody       |

Photos go to a temporary folder that is deleted afterwards.

### In CI

The **Tests** job in `ci.yml` starts a `postgres:17` service container and runs `turbo run test` on every PR and on `main`.

---

## Deploying (Neon + Cloudinary + Render + GitHub)

The live app is one Docker container on **Render** (the API, which also serves the website), a Postgres database on **Neon**, and photos on **Cloudinary**. All three have free plans with no credit card.

Deploys are **manual**: merging to `main` does not deploy. You press **Run workflow** in GitHub Actions.

Do the steps in this order: Neon and Cloudinary first (they give you the values Render needs), then Render, then GitHub.

### 1. Neon (the database)

1. Go to https://neon.tech → **Sign up** (GitHub login is easiest). The free plan is enough.
2. Create a project:
   - **Project name**: `memories`
   - **Postgres version**: 17
   - **Region**: **AWS Asia Pacific (Singapore)** (close to Render's Singapore region, so the app is fast)
   - Click **Create project**.
3. On the project dashboard, click **Connect** (top right).
4. In the window that opens:
   - **Branch**: `main`, **Database**: `neondb`, **Role**: the owner role (e.g. `neondb_owner`)
   - Turn **off** the **Connection pooling** switch (the migrations need a direct connection)
   - Choose **Connection string**, click the eye icon to show the password, then **Copy**.
5. It looks like this:

   ```
   postgresql://neondb_owner:PASSWORD@ep-xxxx-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

   - Check that the host does **not** contain `-pooler` (that would be the pooled one).
   - Keep `?sslmode=require` at the end.
   - Save it somewhere safe for now: it becomes **`DATABASE_URL` on Render**.

You don't need to create any tables: the app runs the migrations itself every time it starts.

Good to know: on the free plan Neon pauses the database after a few minutes without use, and wakes it up on the next request (a second or two).

### 2. Cloudinary (the photos)

Render's free disk is wiped on every deploy, so photos must live somewhere else.

1. Go to https://cloudinary.com → **Sign up for free** (no credit card).
   - When it asks what you'll use it for, any answer is fine (e.g. "Developer" / "Personal project").
2. Open the **Settings** (gear icon, bottom left of the console) → **API Keys**.
3. At the top you'll see **API environment variable**:

   ```
   CLOUDINARY_URL=cloudinary://<your_api_key>:<your_api_secret>@your-cloud-name
   ```

   - Click **Reveal** (or the eye) next to the API secret in the keys table to see the secret.
   - Build the value **without** the `CLOUDINARY_URL=` part and **without** the `< >`:
     ```
     cloudinary://123456789012345:AbCdEfGhIjKlMnOpQrStUvWxYz0@your-cloud-name
     ```
   - This becomes **`CLOUDINARY_URL` on Render**.

4. Optional: in **Media Library** you'll later see a `memories` folder with every uploaded photo (the folder name comes from `CLOUDINARY_FOLDER`).

The free plan has plenty of room for a portfolio app. Photos are resized on the fly for thumbnails, so pages stay fast.

### 3. Render (the app)

1. Go to https://render.com → **Get Started** → sign up **with GitHub**.
   - When asked, allow Render to access your GitHub (all repositories, or only `memories`).
2. In the dashboard: **New +** → **Web Service**.
3. **Connect a repository**: pick `<your-github-username>/memories` (if it's not listed, click **Configure account** and give Render access to it).
4. Fill in the form:

   | Field          | Value                                               |
   | -------------- | --------------------------------------------------- |
   | Name           | `memories` (this becomes the `*.onrender.com` name) |
   | Language       | **Docker** (Render finds the `Dockerfile`)          |
   | Branch         | `main`                                              |
   | Region         | **Singapore**                                       |
   | Root Directory | leave empty                                         |
   | Instance Type  | **Free**                                            |

5. **Environment Variables** (on the same page, or later in the **Environment** tab) → **Add Environment Variable** for each:

   | Key                 | Value                                                                               |
   | ------------------- | ----------------------------------------------------------------------------------- |
   | `DATABASE_URL`      | the Neon connection string from step 1 (direct, ends with `?sslmode=require`)       |
   | `SESSION_SECRET`    | a new long random string, **different from your local one**: `openssl rand -hex 32` |
   | `PHOTO_STORAGE`     | `cloudinary`                                                                        |
   | `CLOUDINARY_URL`    | the `cloudinary://...` value from step 2                                            |
   | `CLOUDINARY_FOLDER` | `memories`                                                                          |

   Don't add `PORT` or `NODE_ENV`: Render provides `PORT`, and `NODE_ENV=production` is set in the `Dockerfile`.

6. **Advanced** (bottom of the form):
   - **Health Check Path**: `/api/health`
   - **Auto-Deploy**: **Off** (we deploy from GitHub Actions instead)
7. Click **Deploy Web Service**. The first build takes a few minutes. Open **Logs** and wait for:
   ```
   Connected to database
   Photos are stored in Cloudinary
   API running on port 10000
   ```
   Then open `https://<your-service-name>.onrender.com`.
8. Get the **Deploy Hook** (used by GitHub in the next step):
   - Your service → **Settings** → scroll to **Deploy Hook** → **Copy**.
   - It looks like `https://api.render.com/deploy/srv-xxxx?key=yyyy`.
   - Keep it secret: anyone with this URL can start a deploy. If it ever leaks, click **Regenerate** on the same page.

Good to know: free Render services go to sleep after about 15 minutes without visitors, and the next visit wakes them up (around a minute). Live chats and notifications (Socket.IO) work on Render without extra settings.

### 4. GitHub (the Deploy button)

The **Deploy** workflow (`.github/workflows/deploy.yml`) type-checks and builds the code, then calls Render's deploy hook. GitHub needs the hook as a secret:

1. On GitHub, open the repository → **Settings** → **Environments** (left menu) → **New environment**.
2. Name it exactly `production` → **Configure environment**.
3. Under **Environment secrets** → **Add environment secret**:
   - **Name**: `RENDER_DEPLOY_HOOK`
   - **Value**: the deploy hook URL from Render
   - **Add secret**.
4. Optional but recommended, so nothing broken reaches `main`:
   - **Settings** → **Rules** → **Rulesets** → **New ruleset** → **New branch ruleset**
   - Name it `main`, set **Enforcement status** to **Active**, **Target branches** → **Add target** → **Include default branch**
   - Turn on **Require a pull request before merging** and **Require status checks to pass**, then add the checks **Type-check and build** and **Docker image builds** (they appear after CI has run once)
   - **Create**.

### 5. Deploy

1. Merge your pull request into `main` (CI must be green).
2. GitHub → **Actions** → **Deploy** (left list) → **Run workflow** → branch `main` → **Run workflow**.
3. The workflow runs **Type-check and build**, then **Deploy to Render**. Both should turn green.
4. On Render, open **Logs** and wait for `API running on port ...`. New migrations run automatically before the app starts.
5. Open the live site and check what you changed.

### Checking photos in production

- Right-click a photo → **Open image in new tab**: the address should start with `https://res.cloudinary.com/...`.
- Neon → **SQL Editor**: `SELECT url FROM memory_photos ORDER BY created_at DESC LIMIT 3;`
- Restart the Render service (**Manual Deploy** → **Restart service**): photos must still load afterwards.

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

### Auth and account

| Method       | Path                    | What it does                             |
| ------------ | ----------------------- | ---------------------------------------- |
| GET          | `/api/health`           | Health check                             |
| POST         | `/api/auth/register`    | Create an account                        |
| POST         | `/api/auth/login`       | Log in (username or email)               |
| GET          | `/api/auth/me`          | Current user                             |
| POST         | `/api/auth/logout`      | Log out                                  |
| PATCH        | `/api/account/profile`  | Change name, username, birthday          |
| PUT          | `/api/account/password` | Change password (logs out other devices) |
| PUT / DELETE | `/api/account/photo`    | Upload / remove your profile photo       |
| PUT          | `/api/account/privacy`  | "Who can message me?" (friends / anyone) |

### Memories, likes, comments

| Method       | Path                                    | What it does                                            |
| ------------ | --------------------------------------- | ------------------------------------------------------- |
| GET          | `/api/memories`                         | Journal (cursor pagination, `?authorId=` for a profile) |
| POST         | `/api/memories`                         | Keep a memory (multipart form with photos)              |
| GET          | `/api/memories/:id`                     | One memory                                              |
| PATCH        | `/api/memories/:id`                     | Edit (owner only)                                       |
| DELETE       | `/api/memories/:id`                     | Delete (owner only)                                     |
| PUT / DELETE | `/api/memories/:id/like`                | Like / unlike                                           |
| GET / POST   | `/api/memories/:id/comments`            | List / add comments                                     |
| DELETE       | `/api/memories/:id/comments/:commentId` | Delete a comment (its author or the memory's owner)     |

A memory you can't see returns **404** (so nobody can tell whether it exists); a memory you can see but don't own returns **403** when you try to change it.

### People, friends, album

| Method        | Path                                    | What it does                              |
| ------------- | --------------------------------------- | ----------------------------------------- |
| GET           | `/api/users?q=`                         | Search people                             |
| GET           | `/api/users/:username`                  | Profile (includes `canMessage`)           |
| GET           | `/api/friends`                          | Your friends                              |
| GET           | `/api/friends/requests`                 | Incoming and sent requests                |
| POST / DELETE | `/api/friends/requests/:userId`         | Send / cancel a request                   |
| POST          | `/api/friends/requests/:userId/accept`  | Accept                                    |
| POST          | `/api/friends/requests/:userId/decline` | Decline                                   |
| DELETE        | `/api/friends/:userId`                  | Unfriend                                  |
| GET           | `/api/album/:username`                  | Someone's album, grouped by year          |
| PUT           | `/api/album/notes/:year`                | Your line about a year (empty removes it) |

### Notifications

| Method | Path                              | What it does           |
| ------ | --------------------------------- | ---------------------- |
| GET    | `/api/notifications`              | Your notifications     |
| GET    | `/api/notifications/unread-count` | The number on the bell |
| POST   | `/api/notifications/:id/read`     | Mark one as read       |
| POST   | `/api/notifications/read-all`     | Mark all as read       |

### Messages

| Method       | Path                                                 | What it does                                        |
| ------------ | ---------------------------------------------------- | --------------------------------------------------- |
| GET          | `/api/conversations?folder=inbox\|requests\|archive` | Your chats in one folder                            |
| GET          | `/api/conversations/counts`                          | Unread chats and waiting requests                   |
| GET          | `/api/conversations/people?q=`                       | People you're allowed to message or add to a group  |
| POST         | `/api/conversations/direct`                          | Open (or start) a chat with one person              |
| POST         | `/api/conversations/groups`                          | Create a group (3 to 57 people)                     |
| GET / PATCH  | `/api/conversations/:id`                             | One chat / rename a group                           |
| PUT / DELETE | `/api/conversations/:id/photo`                       | Change / remove a group's photo                     |
| GET / POST   | `/api/conversations/:id/messages`                    | Messages (cursor pagination) / send (text + photos) |
| PATCH        | `/api/conversations/:id/messages/:messageId`         | Edit your message (first 22 minutes)                |
| DELETE       | `/api/conversations/:id/messages/:messageId`         | Unsend your message                                 |
| POST         | `/api/conversations/:id/read`                        | Mark as seen                                        |
| POST         | `/api/conversations/:id/accept` / `decline`          | Answer a request                                    |
| PUT / DELETE | `/api/conversations/:id/archive`                     | Archive / move back                                 |
| POST         | `/api/conversations/:id/members`                     | Add people to a group                               |
| DELETE       | `/api/conversations/:id/members/:userId`             | Remove someone (your own id = leave)                |
| PUT          | `/api/conversations/:id/members/:userId/role`        | Make admin / moderator / member (admins only)       |

### Live updates (Socket.IO)

The website keeps one live connection (path `/socket.io`, same login cookie). The server sends `notification`, `message:new`, `message:changed`, `conversation:changed`, `conversation:read` and `typing`; the browser sends `typing`.

---

## Troubleshooting

| Problem                                                     | Fix                                                                                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `ERR_PNPM_NO_PKG_MANIFEST` / package.json not found         | You're in the wrong folder: `cd` to the project root                                                                     |
| `turbo: command not found`                                  | Install it once: `pnpm add -g turbo`                                                                                     |
| dbmate: connection refused on `[::1]:5432`                  | Start Docker Desktop and `docker compose up -d db`; use `127.0.0.1` in `DATABASE_URL`                                    |
| `Cannot find module '@memories/shared'`                     | Run `turbo run build` (the shared package must be built first)                                                           |
| A 500 error on something new after pulling                  | A migration hasn't run: `turbo run db:migrate`, then restart `turbo run dev`                                             |
| `[vite] http proxy error … ECONNREFUSED`                    | The API isn't running (yet). Once at startup is normal; if it repeats, check the `@memories/api#dev` panel for the error |
| A setting "doesn't stick" when testing two accounts         | Both tabs share one login: use a normal and an incognito window                                                          |
| `PHOTO_STORAGE must be "local" or "cloudinary"`             | Fix the value in `apps/api/.env` or on Render                                                                            |
| `CLOUDINARY_URL should look like ...`                       | Copy it again from Cloudinary; no `< >` and no `CLOUDINARY_URL=` left in it                                              |
| Photos disappear on the live site after a deploy            | `PHOTO_STORAGE` isn't `cloudinary` on Render                                                                             |
| Deploy workflow fails at "Trigger Render deploy"            | The `RENDER_DEPLOY_HOOK` secret is missing or wrong (GitHub → Settings → Environments → `production`)                    |
| Render logs: `password authentication failed` / `ENOTFOUND` | `DATABASE_URL` on Render is wrong: copy the direct (not pooled) Neon string again                                        |
| CI fails but it works on Windows                            | File name case: Linux sees `AuthRoutes.ts` and `authRoutes.ts` as different files (`git config core.ignorecase false`)   |
