FROM node:22-alpine

WORKDIR /app

# Install simulator workspace dependencies from root lockfile (deterministic build).
COPY package.json package-lock.json ./
COPY tracker-simulator/package.json ./tracker-simulator/
RUN npm ci --workspace=tracker-simulator --include-workspace-root

# Copy simulator source
COPY tracker-simulator/ ./tracker-simulator/

WORKDIR /app/tracker-simulator

CMD ["node", "index.js"]
