# =============================================================================
# Stage 1 - Build
# =============================================================================
FROM node:24-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Copy only the frontend build inputs.
COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY src ./src
RUN npm run build

# =============================================================================
# Stage 2 - Marmiton proxy
# =============================================================================
FROM node:24-alpine AS recipes-search-proxy

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server ./server

CMD ["node", "server/recipes-search-proxy.cjs"]

# =============================================================================
# Stage 3 - Frontend serve
# =============================================================================
FROM nginx:1.27-alpine AS runner

RUN apk add --no-cache gettext

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --chmod=755 docker-entrypoint.sh /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
