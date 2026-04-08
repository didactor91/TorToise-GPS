#!/bin/bash
# deploy/setup.sh — Run ONCE on a fresh Hetzner Ubuntu 24.04 server
# Usage: bash deploy/setup.sh
set -euo pipefail

REPO="https://github.com/didactor91/TorToise-GPS.git"
APP_DIR="/opt/tortoise-gps"
DEPLOY_USER="tortoise"

echo "══════════════════════════════════════════"
echo "  TorToise GPS — Server Setup"
echo "══════════════════════════════════════════"

# ── 1. System update ────────────────────────────────────────────────
echo "▶ Updating system..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Install Docker ───────────────────────────────────────────────
echo "▶ Installing Docker..."
curl -fsSL https://get.docker.com | sh

# ── 3. Create deploy user ───────────────────────────────────────────
echo "▶ Creating deploy user: $DEPLOY_USER..."
if ! id "$DEPLOY_USER" &>/dev/null; then
    useradd -m -s /bin/bash "$DEPLOY_USER"
    usermod -aG docker "$DEPLOY_USER"
    echo "  ✅ User $DEPLOY_USER created"
else
    echo "  ⏭  User $DEPLOY_USER already exists"
fi

# ── 4. Clone repo ───────────────────────────────────────────────────
echo "▶ Cloning repository to $APP_DIR..."
if [ -d "$APP_DIR" ]; then
    echo "  ⏭  Directory already exists — skipping clone"
else
    git clone "$REPO" "$APP_DIR"
    chown -R "$DEPLOY_USER":"$DEPLOY_USER" "$APP_DIR"
    echo "  ✅ Repo cloned"
fi

# ── 5. Create .env.prod ─────────────────────────────────────────────
if [ ! -f "$APP_DIR/deploy/.env.prod" ]; then
    echo ""
    echo "══════════════════════════════════════════"
    echo "  ⚠️  ACTION REQUIRED"
    echo "══════════════════════════════════════════"
    echo ""
    echo "  Create the production env file:"
    echo "  cp $APP_DIR/deploy/.env.prod.example $APP_DIR/deploy/.env.prod"
    echo "  nano $APP_DIR/deploy/.env.prod"
    echo ""
    echo "  Fill in:"
    echo "    MONGO_URL   — MongoDB Atlas connection string"
    echo "    JWT_SECRET  — 64 random bytes"
    echo ""
fi

# ── 6. Firewall ─────────────────────────────────────────────────────
echo "▶ Configuring firewall (ufw)..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp    # HTTP  (Caddy redirect)
ufw allow 443/tcp   # HTTPS (Caddy)
ufw allow 443/udp   # HTTP/3
ufw allow 5000/tcp  # GPS hardware TCP
ufw --force enable
echo "  ✅ Firewall configured"

echo ""
echo "══════════════════════════════════════════"
echo "  Setup complete!"
echo ""
echo "  Next steps:"
echo "  1. Fill in $APP_DIR/deploy/.env.prod"
echo "  2. cd $APP_DIR && bash deploy/deploy.sh"
echo "══════════════════════════════════════════"
