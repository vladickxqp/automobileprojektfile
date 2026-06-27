# CarDNA API — production image.
# pnpm monorepo; the API runs via tsx so the TypeScript `@autolife/shared` workspace package
# resolves without a separate build step. Verified to boot + serve /health.
FROM node:20-slim

WORKDIR /app
ENV HOST=0.0.0.0
# NODE_ENV is set to "production" at runtime by the host (render.yaml). It is intentionally NOT set
# during the build so that pnpm installs devDependencies needed for the toolchain.

# OpenSSL + CA certs are required by the Prisma query engine.
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.6.0 --activate

# Install workspace dependencies (lockfile-frozen). Copy manifests first for layer caching.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/mobile/package.json ./apps/mobile/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN pnpm install --frozen-lockfile

# Application source.
COPY . .

# Generate the Prisma client for this platform.
RUN pnpm --filter @autolife/api exec prisma generate

EXPOSE 3000

# Applies pending migrations, then starts the API. DATABASE_URL / JWT_SECRET come from the host env.
CMD ["pnpm", "--filter", "@autolife/api", "run", "start:prod"]
