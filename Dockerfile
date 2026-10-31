# The production image for Render: the API only. The website is built and
# hosted on Netlify (netlify.toml), so it's not in this image.
FROM node:22-slim AS build
WORKDIR /app
RUN corepack enable

COPY . .
RUN pnpm install --frozen-lockfile
# The API and the shared package it uses (not the website)
RUN pnpm turbo run build --filter=@memories/api

FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production

# Installed packages (pnpm keeps them in the root node_modules)
COPY --from=build /app/node_modules ./node_modules

# Shared package: compiled code only
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist

# API: compiled code + migrations
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/db ./apps/api/db

WORKDIR /app/apps/api
EXPOSE 4000

# Run new migrations, then start the API
CMD ["sh", "-c", "./node_modules/.bin/dbmate --no-dump-schema --wait migrate && node dist/main.js"]