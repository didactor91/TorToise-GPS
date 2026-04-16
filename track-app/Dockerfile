FROM node:22-alpine AS build

WORKDIR /app

# Copy workspace files
COPY package.json package-lock.json ./
COPY track-data/package.json ./track-data/
COPY track-utils/package.json ./track-utils/
COPY track-app/package.json ./track-app/

# Install dependencies
RUN npm ci --workspace=track-app --include-workspace-root --include=dev --include=optional

# Copy source code
COPY track-data/ ./track-data/
COPY track-utils/ ./track-utils/
COPY track-app/ ./track-app/

WORKDIR /app/track-app

# VITE_API_URL is a build-time variable baked into the JS bundle.
# - Local Docker:  ARG VITE_API_URL=/api        (relative, nginx proxies internally)
# - Production:    ARG VITE_API_URL=https://api.yourdomain.com/api
# Pass it with: docker build --build-arg VITE_API_URL=https://... 
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# ── Nginx stage ───────────────────────────────────────────────────────────────
FROM nginx:alpine
COPY --from=build /app/track-app/dist /usr/share/nginx/html
COPY track-app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
