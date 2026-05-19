FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10 --activate
RUN apk add --no-cache python3 make g++ libc6-compat

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
RUN mkdir -p data && chown nextjs:nodejs data
USER nextjs
EXPOSE 3000
ENV NODE_ENV=production PORT=3000
CMD ["node", "server.js"]
