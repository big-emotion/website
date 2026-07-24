# Stage 1: install dependencies and build
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable

# Install deps first so this layer is cached when only source changes.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Case studies are read from Prismic during `next build` (SWBE-24), so the build stage
# needs credentials the runtime never does. The repository name is not sensitive and
# rides in as a plain build arg; the read token is mounted as a BuildKit secret so it
# stays out of the image layers and out of `docker history`.
ARG PRISMIC_REPOSITORY_NAME
ENV PRISMIC_REPOSITORY_NAME=$PRISMIC_REPOSITORY_NAME

RUN --mount=type=secret,id=prismic_access_token \
    PRISMIC_ACCESS_TOKEN="$(cat /run/secrets/prismic_access_token)" pnpm build

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

# Playground counter's flat-file store (SWBE-216/DEC-033) writes here. Pre-creating it
# with nextjs ownership matters because Docker seeds a fresh named volume from whatever
# already exists at the mount path in the image, ownership included — without this the
# compose volume mounts in as root-owned and the non-root process can't write to it.
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
