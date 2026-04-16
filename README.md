# **T**or**T**oise **GPS**

### 🚚 Real-time fleet tracking — 🛰 GPS over TCP

**TorToise GPS** is a full-stack web application for real-time truck fleet tracking. GPS hardware transmits NMEA-like frames over TCP; the system ingests them, persists the positions, and pushes live updates to the map via **GraphQL Subscriptions (WebSocket)**.

---

## Tech Stack

| Module | Tech |
|--------|------|
| **`track-app`** | React 18, TypeScript, Vite, Apollo Client 3, GraphQL, Leaflet + OpenStreetMap |
| **`track-api`** | Express 5, Apollo Server 4, GraphQL (HTTP + WebSocket), Argon2, JWT HS256, MongoDB |
| **`track-tcp`** | Node.js TCP server — parses GPS frames, forwards to API |
| **`track-data`** | Shared Mongoose models (`User`, `Tracker`, `Track`, `POI`) |
| **`track-utils`** | Shared Node.js utilities (validation, custom errors, HTTP call) |
| **`tracker-simulator`** | Realistic GPS simulator — 30 trucks on 15 motorway routes |
| **Database** | MongoDB 7 |

> Maps use **OpenStreetMap** + **CartoDB Dark Matter** (dark mode). No API key required.

---

## Architecture Overview

```
Browser (React + Apollo Client)
  │
  ├── HTTP  POST /graphql        ← queries & mutations
  └── WebSocket  ws://…/graphql  ← live truck positions (Subscription)
         │
  Apollo Server 4 (Express 5)   :8085
  ├── /graphql   (HTTP + WS)     ← main API consumed by frontend
  └── /api/tracks/TCP/add        ← unauthenticated REST endpoint for GPS hardware
         │
  track-tcp  :5000               ← raw TCP → parses frame → POST /api/tracks/TCP/add
         │
  MongoDB 7  :27017
```

---

## Quick Start — One Command

```bash
./start_local.sh
```

This single script:
1. Starts a local MongoDB instance
2. Starts the backend API on port **8085**
3. Starts the TCP server on port **5000**
4. Creates the demo user and assigns the 30 simulator trackers (idempotent — safe to re-run)
5. Starts the GPS simulator (30 trucks on 15 routes, paired in opposite direction)
6. Starts the Vite dev server on port **3000**

**Prerequisites**: Node.js v18+ and MongoDB installed locally.

### Access points

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **GraphQL endpoint** | http://localhost:8085/graphql |
| **API health** | http://localhost:8085/api/health |
| **TCP server** | `localhost:5000` (raw TCP) |

### Demo account

Created automatically on first run:

| | |
|-|-|
| **Email** | `livedemo@example.com` |
| **Password** | `LiveDemo` |

### Backoffice (`/backoffice`)

- Access is restricted to users with `role = staff`.
- Backoffice lets staff manage companies and users (MVP scope).
- To promote an existing user to `staff`, run:

```bash
cd track-api
npm run promote:staff -- livedemo@example.com
```

### Production migrations (MongoDB)

`track-api` includes a simple migration runner with execution journal in the `migrations` collection.

```bash
# Dry-run pending migrations
npm run migrate:api:dry

# Run all pending migrations
npm run migrate:api

# Run one specific migration by timestamp or timestamp+name
npm run migrate:api -- 20260411143000
npm run migrate:api -- 20260411143000-add-company-index
npm run migrate:api -- 20260410000000-backfill-user-language
```

For this to work in production, make sure `MONGO_URL` points to your production database.

Current migration included:
- `20260410000000-backfill-user-language`: sets `language = "en"` for users where language is missing/null/empty.

Create a new migration template (timestamp auto-generated):

```bash
npm run migrate:api:new -- add-company-index
```

Optional: pass full name manually:

```bash
npm run migrate:api:new -- 20260411143000-add-company-index
```

### Mongo storage diagnostics

Inspect collection and index size footprint:

```bash
npm run db:report -w track-api
```

### Simulated trucks

- Total: `30` trucks
- Routes: `15` operational routes
- Assignment rule: `2` trucks per route, one starts outbound and the other inbound
- Serial range: `9900111001` to `9900111030`

### Simulator track retention (MongoDB cleanup)

`track-api` runs an automatic cleanup job that deletes old `Track` documents **only** for simulator serial numbers.

- Default retention: `60` days
- Default interval: every `60` minutes
- Default initial delay after API start: `2` minutes
- Default simulator serials: `9900111001` to `9900111030` (30 serials)

Environment variables (optional):

| Variable | Default | Description |
|---------|---------|-------------|
| `SIM_TRACK_CLEANUP_ENABLED` | `true` | Set to `false` to disable the cleanup job |
| `SIM_TRACK_RETENTION_DAYS` | `60` | Number of days to keep simulator tracks |
| `SIM_TRACK_CLEANUP_INTERVAL_MINUTES` | `60` | How often cleanup runs |
| `SIM_TRACK_CLEANUP_INITIAL_DELAY_MINUTES` | `2` | Delay before first cleanup after API start/deploy |
| `SIM_TRACK_SERIALS` | built-in list | Comma-separated serials to clean (simulator-only) |

---

## Docker

```bash
docker compose up -d
```

| Service | URL / Port |
|---------|-----------|
| Frontend | http://localhost |
| GraphQL + API | http://localhost:8080/graphql |
| TCP Server | `localhost:5000` |
| Mongo Express | http://localhost:8081 |

After the stack is up, run the setup script once to create the demo user and assign trackers:

```bash
cd tracker-simulator
API_URL=http://localhost:8080/api node setup.js
```

Then start the GPS simulator:

```bash
TCP_PORT=5000 TCP_HOST=127.0.0.1 node index.js
```

---

## Manual Setup

To start each service individually:

```bash
# 1. Install all workspace dependencies (run once from repo root)
npm install

# 2. Backend API — terminal 1
cd track-api
PORT=8085 MONGO_URL=mongodb://localhost:27017/tortoise-gps JWT_SECRET=your_secret node index.js

# 3. TCP server — terminal 2
cd track-tcp
TCP_PORT=5000 API_URL=http://localhost:8085/api node server.js

# 4. Bootstrap demo user + trackers (run once)
cd tracker-simulator
API_URL=http://localhost:8085/api node setup.js

# 5. GPS simulator — terminal 3
cd tracker-simulator
TCP_PORT=5000 TCP_HOST=127.0.0.1 node index.js

# 6. Frontend dev server — terminal 4
cd track-app
cp .env.dist .env
npm run dev
```

The frontend proxies `/api` and `/graphql` automatically to `http://localhost:8085` via the Vite dev server.

---

## Testing

All backend modules use **Vitest** with in-memory MongoDB (`mongodb-memory-server`) for isolated integration tests.

```bash
# Run tests per workspace
npm run test:api        # 153 tests — API services + GraphQL resolvers
npm run test:tcp        # 15 tests  — TCP parser + server
npm run test:utils      # 5 tests   — validation + errors
npm run test:data       # 10 tests  — Mongoose schemas
npm run test:sim        # 12 tests  — GPS frame generator
```

### Frontend type-check

```bash
cd track-app
npm run typecheck       # tsc --noEmit — must return 0 errors
```

### Regenerate GraphQL types

Run this any time the GraphQL schema changes (requires API running on port 8085):

```bash
npm run codegen         # generates track-app/src/generated/graphql.ts
```

---

## Project Structure

```
TorToise-GPS/
├── track-app/                  # React 18 + TypeScript frontend
│   └── src/
│       ├── components/         # .tsx components (no logic)
│       ├── hooks/              # Custom hooks (Apollo queries/mutations)
│       ├── apollo/             # Apollo Client setup (links, auth, session)
│       ├── graphql/            # .gql operation documents (codegen source)
│       └── generated/          # Auto-generated typed hooks (graphql.ts)
├── track-api/                  # Express 5 + Apollo Server 4
│   └── src/
│       ├── identity/           # User auth domain (routes/service/repository)
│       ├── fleet/              # Tracker management domain
│       ├── tracking/           # GPS track ingestion + retrieval domain
│       ├── poi/                # Points of interest domain
│       ├── graphql/            # GraphQL schema, resolvers, pubsub, context
│       └── shared/             # Auth middleware, error middleware
├── track-tcp/                  # TCP ingestion server
├── track-data/                 # Shared Mongoose models
├── track-utils/                # Shared Node.js utilities
├── tracker-simulator/          # GPS simulator + demo setup
│   ├── index.js                # Simulator entry point
│   ├── randomGPS.js            # Route-interpolation frame generator
│   └── setup.js                # Idempotent demo user + tracker bootstrap
├── codegen.yml                 # GraphQL code generation config
├── docker-compose.yml          # Full stack container orchestration
├── start_local.sh              # One-command local startup script
└── package.json                # npm workspaces root
```

---

## Key Design Decisions

- **GraphQL over REST** for the frontend — Apollo Client with typed hooks generated by `@graphql-codegen`. The TCP ingestion endpoint stays REST (hardware devices cannot carry JWT tokens).
- **WebSocket subscriptions** for live GPS positions — no polling. The map updates the moment a new GPS frame arrives. The client reconnects automatically with exponential backoff (1s → 30s cap) if the connection drops.
- **Modular Monolith** — `track-api` is split into four domain modules (`identity`, `fleet`, `tracking`, `poi`) each with `routes / service / repository`. No microservices overhead.
- **Company-scoped resources** — Trackers and POIs are now modeled at company level, so users in the same company share fleet assets and points of interest.
- **Backend-enforced authorization** — company features and user permissions are checked server-side for every read/create/update/delete operation, so frontend tampering cannot bypass access restrictions.
- **Track collection isolated** — GPS tracks are stored in a standalone MongoDB collection (not embedded in the User document), preventing the 16 MB document limit from being reached.
- **TypeScript on the frontend** — strict mode, `tsconfig.json`, `@types/leaflet`, and codegen-generated types give end-to-end type safety from the GraphQL schema to the React components.
- **OpenStreetMap** — zero-cost, no API key, no unexpected bills.
