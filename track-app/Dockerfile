FROM node:22-alpine AS build

WORKDIR /app

# Copy workspace files
COPY package.json package-lock.json ./
COPY track-data/package.json ./track-data/
COPY track-utils/package.json ./track-utils/
COPY track-app/package.json ./track-app/

# Install dependencies
RUN npm ci --workspace=track-app --include-workspace-root

# Copy source code
COPY track-data/ ./track-data/
COPY track-utils/ ./track-utils/
COPY track-app/ ./track-app/

WORKDIR /app/track-app

# Build the frontend. 
# We pass the VITE_API_URL so it can connect to the proxy we'll setup in nginx
ENV VITE_API_URL=/api
RUN npm run build

# Use Nginx to serve the static files and proxy /api requests to track-api
FROM nginx:alpine
COPY --from=build /app/track-app/dist /usr/share/nginx/html
COPY track-app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
