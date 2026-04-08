# TorToise GPS — Fly.io Deployment Guide

## Prerequisites

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login
```

## Step 1 — Deploy track-api

```bash
# Create the app (first time only)
fly launch --config fly/api.toml --no-deploy --name tortoise-api

# Set secrets (use your real MongoDB Atlas connection string)
fly secrets set --app tortoise-api \
  MONGO_URL="mongodb+srv://user:password@cluster.mongodb.net/tortoise-gps" \
  JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"

# Deploy
fly deploy --config fly/api.toml --dockerfile track-api/Dockerfile

# Verify
curl https://tortoise-api.fly.dev/api/health
```

## Step 2 — Deploy track-tcp (with static IP)

```bash
# Create the app (first time only)
fly launch --config fly/tcp.toml --no-deploy --name tortoise-tcp

# Allocate a dedicated IPv4 — this is the fixed IP for your GPS hardware ($2/mo)
fly ips allocate-v4 --app tortoise-tcp

# Note the IP shown — configure your GPS hardware to send to <IP>:5000

# Set secrets
fly secrets set --app tortoise-tcp \
  API_URL="https://tortoise-api.fly.dev/api"

# Deploy
fly deploy --config fly/tcp.toml --dockerfile track-tcp/Dockerfile

# Check logs
fly logs --app tortoise-tcp
```

## Step 3 — Deploy track-app (frontend)

```bash
# Create the app (first time only)
fly launch --config fly/app.toml --no-deploy --name tortoise-app

# Deploy (VITE_API_URL is set in fly/app.toml build args)
fly deploy --config fly/app.toml --dockerfile track-app/Dockerfile

# Open in browser
fly open --app tortoise-app
```

## Step 4 — Bootstrap demo user

```bash
# Run setup script pointing to production API
cd tracker-simulator
API_URL=https://tortoise-api.fly.dev/api node setup.js
```

## Useful commands

```bash
# View logs
fly logs --app tortoise-api
fly logs --app tortoise-tcp
fly logs --app tortoise-app

# SSH into a machine
fly ssh console --app tortoise-api

# List allocated IPs
fly ips list --app tortoise-tcp

# Redeploy after code changes
fly deploy --config fly/api.toml --dockerfile track-api/Dockerfile
fly deploy --config fly/tcp.toml --dockerfile track-tcp/Dockerfile
fly deploy --config fly/app.toml --dockerfile track-app/Dockerfile
```

## Cost summary

| Resource | Cost/month |
|----------|-----------|
| tortoise-api (shared-cpu-1x 256MB) | ~$2 |
| tortoise-tcp (shared-cpu-1x 256MB) | ~$2 |
| tortoise-app (shared-cpu-1x 256MB) | ~$2 |
| Dedicated IPv4 for tortoise-tcp | $2 |
| MongoDB Atlas M0 | Free |
| **Total** | **~$8/month** |

> Machines with `auto_stop_machines = 'stop'` stop when idle and restart on demand.
> tortoise-tcp stays running 24/7 (GPS hardware sends frames continuously).
