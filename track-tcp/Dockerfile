FROM node:22-alpine

WORKDIR /app

# Copy workspace manifests needed to resolve internal packages
COPY package.json package-lock.json ./
COPY track-data/package.json ./track-data/
COPY track-utils/package.json ./track-utils/
COPY track-tcp/package.json ./track-tcp/

# Install all workspace dependencies
RUN npm ci --workspace=track-tcp --include-workspace-root

# Copy source for internal packages
COPY track-utils/ ./track-utils/

# Copy track-tcp source
COPY track-tcp/ ./track-tcp/

WORKDIR /app/track-tcp

EXPOSE 5000

CMD ["node", "server.js"]
