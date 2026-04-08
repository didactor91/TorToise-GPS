#!/bin/bash
# deploy/deploy.sh — Deploy or update TorToise GPS
# Run from the repo root: bash deploy/deploy.sh
{
set -euo pipefail

APP_DIR="/opt/tortoise-gps"
ENV_FILE="$APP_DIR/deploy/.env.prod"
COMPOSE="docker compose -f $APP_DIR/docker-compose.prod.yml --env-file $ENV_FILE"

echo "══════════════════════════════════════════"
echo "  TorToise GPS — Deploy"
echo "══════════════════════════════════════════"

# ── Guard: env file must exist ──────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ $ENV_FILE not found."
    echo "   Copy deploy/.env.prod.example to deploy/.env.prod and fill in values."
    exit 1
fi

# ── 1. Pull latest code ─────────────────────────────────────────────
echo "▶ Pulling latest code..."
cd "$APP_DIR"
git fetch origin master
git reset --hard origin/master
echo "  ✅ $(git log -1 --format='%h %s')"

# ── 2. Build images ─────────────────────────────────────────────────
echo "▶ Building Docker images..."
$COMPOSE build --no-cache track-api track-tcp track-app

# ── 3. Rolling restart ──────────────────────────────────────────────
echo "▶ Starting services..."
$COMPOSE up -d --remove-orphans

# ── 4. Health check ─────────────────────────────────────────────────
echo "▶ Waiting for API health check..."
sleep 5
for i in $(seq 1 12); do
    if curl -sf http://localhost/api/health > /dev/null 2>&1; then
        echo "  ✅ API healthy"
        break
    fi
    echo "  ... waiting ($i/12)"
    sleep 5
done

# ── 5. Bootstrap demo user (idempotent) ─────────────────────────────
echo "▶ Bootstrapping demo user..."
docker run --rm \
    --network "$(docker network ls --filter name=tortoise --format '{{.Name}}' | head -1)" \
    -v "$APP_DIR/tracker-simulator:/app/tracker-simulator" \
    -e API_URL=http://tortoise-track-api:8080/api \
    -w /app/tracker-simulator \
    node:22-alpine \
    sh -c "npm install --silent && node setup.js"

# ── 6. Status ───────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════"
echo "  Deploy complete!"
echo ""
$COMPOSE ps
echo ""
echo "  🌐  https://tortoisegps.didtor.dev"
echo "  📡  GPS TCP: 204.168.227.78:5000"
echo "  🔑  livedemo@example.com / LiveDemo"
echo "══════════════════════════════════════════"
}
