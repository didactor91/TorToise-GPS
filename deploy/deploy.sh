#!/bin/bash
# deploy/deploy.sh — Deploy or update TorToise GPS
# Run from the repo root: bash deploy/deploy.sh
{
set -euo pipefail

APP_DIR="/opt/tortoise-gps"
ENV_FILE="$APP_DIR/deploy/.env.prod"
COMPOSE="docker compose -f $APP_DIR/docker-compose.prod.yml --env-file $ENV_FILE"
SIM_CONTAINER="tortoise-tracker-simulator"

echo "══════════════════════════════════════════"
echo "  TorToise GPS — Deploy"
echo "══════════════════════════════════════════"

wait_for_http() {
    local url="$1"
    local label="$2"
    local attempts="${3:-12}"
    local sleep_seconds="${4:-5}"

    echo "▶ Waiting for $label..."
    for i in $(seq 1 "$attempts"); do
        if curl -sf "$url" > /dev/null 2>&1; then
            echo "  ✅ $label healthy"
            return 0
        fi
        echo "  ... waiting $label ($i/$attempts)"
        sleep "$sleep_seconds"
    done

    echo "  ❌ $label health check failed"
    return 1
}

wait_for_tcp() {
    local host="$1"
    local port="$2"
    local label="$3"
    local attempts="${4:-12}"
    local sleep_seconds="${5:-5}"

    echo "▶ Waiting for $label TCP ($host:$port)..."
    for i in $(seq 1 "$attempts"); do
        if timeout 2 bash -lc "exec 3<>/dev/tcp/$host/$port" 2>/dev/null; then
            echo "  ✅ $label TCP reachable"
            return 0
        fi
        echo "  ... waiting $label TCP ($i/$attempts)"
        sleep "$sleep_seconds"
    done

    echo "  ❌ $label TCP check failed"
    return 1
}

wait_for_simulator_stable() {
    local attempts="${1:-12}"
    local sleep_seconds="${2:-5}"

    echo "▶ Waiting for simulator stability..."
    for i in $(seq 1 "$attempts"); do
        local status
        local restart_count
        status="$(docker inspect -f '{{.State.Status}}' "$SIM_CONTAINER" 2>/dev/null || true)"
        restart_count="$(docker inspect -f '{{.RestartCount}}' "$SIM_CONTAINER" 2>/dev/null || echo 999)"

        if [ "$status" = "running" ] && [ "$restart_count" = "0" ]; then
            echo "  ✅ Simulator running and stable"
            return 0
        fi

        echo "  ... simulator status=$status restart_count=$restart_count ($i/$attempts)"
        sleep "$sleep_seconds"
    done

    echo "  ❌ Simulator failed stability check. Last logs:"
    docker logs --tail 120 "$SIM_CONTAINER" || true
    return 1
}

wait_for_simulator_points() {
    local attempts="${1:-12}"
    local sleep_seconds="${2:-5}"

    echo "▶ Checking simulator emits points..."
    for i in $(seq 1 "$attempts"); do
        if docker logs --since 25s "$SIM_CONTAINER" 2>&1 | grep -q '\[simulator\] -> SN:'; then
            echo "  ✅ Simulator is emitting points"
            return 0
        fi
        echo "  ... no GPS frames yet ($i/$attempts)"
        sleep "$sleep_seconds"
    done

    echo "  ❌ Simulator is not emitting points. Last logs:"
    docker logs --tail 120 "$SIM_CONTAINER" || true
    return 1
}

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
$COMPOSE build --no-cache track-api track-tcp track-app tracker-simulator

# ── 3. Rolling restart ──────────────────────────────────────────────
echo "▶ Starting services..."
$COMPOSE up -d --remove-orphans

# ── 4. Health check ─────────────────────────────────────────────────
wait_for_http "http://localhost/api/health" "API"
wait_for_http "http://localhost" "Frontend (Caddy)"
wait_for_tcp "127.0.0.1" "5000" "GPS ingest"
wait_for_simulator_stable
wait_for_simulator_points

# ── 5. Bootstrap demo user (idempotent) ─────────────────────────────
echo "▶ Bootstrapping demo user..."
docker run --rm \
    --network "$(docker network ls --filter name=tortoise --format '{{.Name}}' | head -1)" \
    -v "$APP_DIR/tracker-simulator:/app/tracker-simulator" \
    -e API_URL=http://tortoise-track-api:8080/api \
    -w /app/tracker-simulator \
    node:22-alpine \
    sh -c "npm install --silent && node setup.js"

# Confirm simulator remains stable after bootstrap task.
wait_for_simulator_stable 6 5
wait_for_simulator_points 6 5

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
