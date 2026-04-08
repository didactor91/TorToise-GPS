FROM node:22-alpine

WORKDIR /app

# Copy workspace manifests needed to resolve internal packages
COPY package.json package-lock.json ./
COPY track-data/package.json ./track-data/
COPY track-utils/package.json ./track-utils/
COPY track-api/package.json ./track-api/

# Install all workspace dependencies
RUN npm ci --workspace=track-api --include-workspace-root

# Copy source for internal packages
COPY track-data/ ./track-data/
COPY track-utils/ ./track-utils/

# Copy track-api source
COPY track-api/ ./track-api/

WORKDIR /app/track-api

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8080/api/health || exit 1

CMD ["node", "."]
