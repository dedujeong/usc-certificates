# syntax=docker/dockerfile:1

# Debian-based (not alpine): certificate generation runs Puppeteer/Chromium,
# which needs glibc and a long list of shared libraries that Alpine's musl
# base doesn't provide. The runner stage installs Debian's own `chromium`
# package rather than relying on Puppeteer's bundled download, so Puppeteer
# is pointed at it via PUPPETEER_EXECUTABLE_PATH and skips that download.
FROM node:22-bookworm-slim AS base
# Prisma's query engine needs libssl to detect the correct OpenSSL build at
# `prisma generate` time; without it, it silently guesses an engine that
# doesn't match this image's actual OpenSSL version.
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# ---- deps: install once, reused by build and (implicitly) runtime ----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm ci

# ---- builder: generate Prisma client and build the Next.js app ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# prisma.config.ts requires DATABASE_URL to be set just to load the schema
# (neither `prisma generate` nor `next build` actually connects to a
# database at build time) — a placeholder value is enough here; the real
# one is supplied at runtime via docker-compose's `environment:`.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV JWT_SECRET="placeholder-build-time-secret-not-used"
RUN npx prisma generate
RUN npm run build

# ---- runner: minimal production image ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium \
  && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs --create-home --home-dir /home/nextjs nextjs
# Chromium's crashpad handler needs a writable $HOME to create its crash
# database in, which a system user created without --create-home lacks.
ENV HOME=/home/nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
