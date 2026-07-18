# Stage 1: install dependencies and build
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable

# Install deps first so this layer is cached when only source changes.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Stage 2: minimal production runtime
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Drop root — Next.js standalone server doesn't need it.
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy the self-contained standalone output.
# Per Next.js docs, public/ and .next/static must be copied alongside
# the standalone folder for the built-in server to serve them.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static   ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public         ./public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
