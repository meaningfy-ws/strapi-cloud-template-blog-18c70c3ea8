# --- Stage 1: Dependencies ---
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# --- Stage 2: Builder ---
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Strapi build compiles the admin panel (needs all deps including devDeps)
RUN npm run build

# --- Stage 3: Production dependencies ---
FROM node:22-alpine AS prod-deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- Stage 4: Runner ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=1337

RUN addgroup --system --gid 1001 strapi \
 && adduser --system --uid 1001 strapi

# Copy production-only node_modules (excludes better-sqlite3, includes pg)
COPY --chown=strapi:strapi --from=prod-deps /app/node_modules ./node_modules
# Copy built admin panel
COPY --chown=strapi:strapi --from=builder /app/build ./build
# Copy runtime source
COPY --chown=strapi:strapi --from=builder /app/package.json ./
COPY --chown=strapi:strapi --from=builder /app/config ./config
COPY --chown=strapi:strapi --from=builder /app/database ./database
COPY --chown=strapi:strapi --from=builder /app/src ./src
COPY --chown=strapi:strapi --from=builder /app/public ./public
COPY --chown=strapi:strapi --from=builder /app/scripts ./scripts
COPY --chown=strapi:strapi --from=builder /app/types ./types
COPY --chown=strapi:strapi --from=builder /app/favicon.png ./
COPY --chown=strapi:strapi --from=builder /app/jsconfig.json ./

# Create writable directories for Strapi runtime
RUN mkdir -p .tmp public/uploads \
 && chown strapi:strapi .tmp public/uploads

USER strapi

EXPOSE 1337

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:1337/admin || exit 1

CMD ["npm", "start"]