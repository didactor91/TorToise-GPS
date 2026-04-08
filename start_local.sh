#!/bin/bash
set -e

echo "🛑 Deteniendo servicios previos si existen..."
pkill -f "track-api/index.js"        || true
pkill -f "track-tcp/server.js"       || true
pkill -f "tracker-simulator/index.js" || true
pkill -f "vite"                       || true
pkill -f "mongod --dbpath /tmp/tortoise_mongo" || true
sleep 2

echo "🍃 Iniciando MongoDB local en /tmp/tortoise_mongo..."
mkdir -p /tmp/tortoise_mongo
mongod --dbpath /tmp/tortoise_mongo --port 27017 > /tmp/mongo.log 2>&1 &
sleep 3

echo "🔌 Iniciando Backend API (Puerto 8085)..."
PORT=8085 MONGO_URL=mongodb://localhost:27017/tortoise-gps JWT_SECRET=test_secret \
  node /home/didac/TorToise-GPS/track-api/index.js > /tmp/api.log 2>&1 &
sleep 3

echo "📡 Iniciando Servidor TCP (Puerto 5000)..."
TCP_PORT=5000 API_URL=http://localhost:8085/api \
  node /home/didac/TorToise-GPS/track-tcp/server.js > /tmp/tcp.log 2>&1 &
sleep 1

echo "👤 Configurando usuario livedemo y trackers..."
cd /home/didac/TorToise-GPS/tracker-simulator
API_URL=http://localhost:8085/api node setup.js
cd /home/didac/TorToise-GPS

echo "🚚 Iniciando simulador GPS..."
TCP_PORT=5000 TCP_HOST=127.0.0.1 \
  node /home/didac/TorToise-GPS/tracker-simulator/index.js > /tmp/sim.log 2>&1 &
sleep 1

echo "🎨 Iniciando Frontend App (Puerto 3000)..."
cd /home/didac/TorToise-GPS/track-app
cp --update=none .env.dist .env 2>/dev/null || true
VITE_API_URL=/api npx vite --host 0.0.0.0 --port 3000 > /tmp/app.log 2>&1 &
cd /home/didac/TorToise-GPS
sleep 4

echo ""
echo "✅ ¡Todo el stack está levantado y corriendo!"
echo "--------------------------------------------------------"
echo "🌐 Frontend:            http://localhost:3000"
echo "⚙️  API Health:          http://localhost:8085/api/health"
echo "📡 TCP Server:          localhost:5000"
echo "🚚 Simulador:           corriendo en background (/tmp/sim.log)"
echo ""
echo "🔑 Usuario demo:"
echo "   Email:    livedemo@example.com"
echo "   Password: LiveDemo"
echo ""
echo "Logs:"
echo "  /tmp/mongo.log  /tmp/api.log  /tmp/tcp.log"
echo "  /tmp/sim.log    /tmp/app.log"
echo "--------------------------------------------------------"
