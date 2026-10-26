# syntax=docker/dockerfile:1
# Web image. Build context is the monorepo root; Go has apps/backend/Dockerfile.
FROM node:24-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY patches/ ./patches/
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/database/package.json ./apps/backend/database/
COPY apps/mobile/package.json ./apps/mobile/
COPY packages/typescript-config/ ./packages/typescript-config/
COPY services/wa-gateway/package.json ./services/wa-gateway/
COPY services/pos-nfc-bridge/package.json ./services/pos-nfc-bridge/
COPY services/pos-print-worker/package.json ./services/pos-print-worker/
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM node:24-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
# Includes app-local dependency copies (web/mobile intentionally use different React patches).
COPY --from=deps /app/ ./
COPY . .
ENV NODE_ENV=production
ARG RAYON_NUM_THREADS=4
ARG CIRCLE_NODE_TOTAL=4
ARG NODE_OPTIONS=--max-old-space-size=4096
RUN --mount=type=cache,target=/app/apps/frontend/.next/cache \
    --mount=type=secret,id=dotenv \
    if [ -f /run/secrets/dotenv ]; then cp /run/secrets/dotenv apps/frontend/.env; fi; \
    pnpm --filter @mizu/frontend build; status=$?; \
    rm -f apps/frontend/.env; \
    if [ -d apps/frontend/.next/standalone ]; then \
      find apps/frontend/.next/standalone -type f -name '.env*' -delete; \
    fi; \
    exit $status

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/public ./apps/frontend/public
# Keep existing /app/storage volume mounts compatible with Next's app-local cwd.
RUN mkdir -p /app/storage/uploads /app/storage/private && \
    chown -R nextjs:nodejs /app/storage && \
    ln -s /app/storage /app/apps/frontend/storage
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
USER nextjs
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget -q -O- http://127.0.0.1:3000/api/ready >/dev/null || exit 1
CMD ["node", "apps/frontend/server.js"]
