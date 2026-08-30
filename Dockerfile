# Requires `output: 'standalone'` in next.config.js (already set).
#
# NEXT_PUBLIC_* vars are inlined by Next.js at BUILD time, not read at
# runtime. Each one therefore needs an ARG here AND must be marked as a
# "Build Variable" in Coolify — a runtime-only variable arrives too late
# and the value compiles to an empty string with no error.

FROM oven/bun:1.3-alpine AS base


# ── deps ──────────────────────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile


# ── builder ───────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time public vars. Add a matching ARG+ENV pair for every new
# NEXT_PUBLIC_* you introduce, or it will be empty in production.
ARG NEXT_PUBLIC_SERVER_URL
ARG NEXT_PUBLIC_SITE_NAME
ARG NEXT_PUBLIC_GA_ID
ARG NEXT_PUBLIC_GTM_ID
ARG NEXT_PUBLIC_FB_PIXEL_ID
ARG NEXT_PUBLIC_R2_PUBLIC_URL

ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_SITE_NAME=$NEXT_PUBLIC_SITE_NAME
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID
ENV NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID
ENV NEXT_PUBLIC_FB_PIXEL_ID=$NEXT_PUBLIC_FB_PIXEL_ID
ENV NEXT_PUBLIC_R2_PUBLIC_URL=$NEXT_PUBLIC_R2_PUBLIC_URL

# The build boots Payload, which connects to MongoDB, so DATABASE_URL and
# PAYLOAD_SECRET must be available as build variables too.
ARG DATABASE_URL
ARG PAYLOAD_SECRET
ENV DATABASE_URL=$DATABASE_URL
ENV PAYLOAD_SECRET=$PAYLOAD_SECRET

ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build


# ── runner ────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# STORAGE_MODE=local writes uploads to /app/public/media, which lives
# inside the container and is destroyed on every redeploy. Mount a
# volume there, or use STORAGE_MODE=r2.

CMD ["node", "server.js"]
