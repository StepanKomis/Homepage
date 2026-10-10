# Homepage — Homelab Dashboard

A unified interface for monitoring and managing homelab services. Built with React, Go, PostgreSQL, and WebSockets for real-time updates.

## Features

- **Service Dashboard**: Monitor Uptime Kuma, Jellyfin, Servarr (Sonarr/Radarr/Bazarr), Audiobookshelf, and custom infrastructure
- **Real-Time Updates**: WebSocket-driven live status feeds
- **Multi-Language**: Czech and English UI
- **Dark Theme**: Crafted for 24/7 monitoring
- **Docker-First**: Compose development, production Dockerfile

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Backend**: Go 1.21+
- **Database**: PostgreSQL
- **Real-Time**: WebSocket (ws library)
- **Containerization**: Docker + Docker Compose

## Development

### Prerequisites

- Node.js 18+
- Go 1.21+
- PostgreSQL 13+
- Docker & Docker Compose

### Quick Start

```bash
# Clone and setup
git clone git@github.com:StepanKomis/Homepage.git
cd Homepage

# Install dependencies
npm install

# Copy environment
cp .env.example .env
cp .env.example .env.local

# Start development environment
docker compose -f docker-compose.dev.yml up -d

# Run dev servers (in separate terminals)
npm run dev:frontend
npm run dev:backend

# Navigate to http://localhost:4200
```

## Project Structure

```
Homepage/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── i18n/
│   │   ├── types/
│   │   └── App.tsx
│   ├── vite.config.ts
│   └── package.json
├── backend/
│   ├── cmd/
│   │   └── server/
│   │       └── main.go
│   ├── internal/
│   │   ├── api/
│   │   ├── models/
│   │   ├── services/
│   │   ├── integrations/
│   │   ├── websocket/
│   │   └── db/
│   ├── go.mod
│   ├── Dockerfile
│   └── main.go
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── .env.example
├── README.md
├── LICENSE
└── .gitignore
```

## Environment Variables

See `.env.example` for full configuration.

```env
# Core
TZ=Europe/Prague
LANG=cs

# Database
DATABASE_URL=postgres://user:password@localhost:5432/homepage

# Backend
BACKEND_PORT=4200
BACKEND_HOST=0.0.0.0

# Integrations
UPTIME_KUMA_URL=http://kuma:3001
JELLYFIN_URL=http://jellyfin:8096
HONCHO_URL=http://honcho:8666
MONGO_URL=mongodb://mongo2:27017
```

## API Endpoints

### WebSocket
- `ws://localhost:4200/api/ws` — Real-time status feeds

### REST (primary)
- `GET /api/v1/status` — All service status
- `GET /api/v1/services/:id` — Service detail
- `GET /api/v1/config` — Client configuration
- `POST /api/v1/integration/test` — Test integration connectivity

## Deployment

### Production

```bash
# Build frontend
npm run build:frontend

# Build backend (inside container via docker-compose)
docker compose -f docker-compose.prod.yml build

# Deploy to home.komis.cz
# (nginx proxy to :4200)
```

### Monitoring

Deployed instance is monitored via Uptime Kuma (kuma 42/43 UP).

## Contributions

Contributions welcome. Please:
1. Branch from `dev`
2. Follow conventional commits (feat:, fix:, docs:, etc.)
3. Ensure all tests pass
4. Open PR against `dev`

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT License — see [LICENSE](./LICENSE) file.

---

**Facility**: home.komis.cz | **Default Port**: 4200 | **TZ**: Europe/Prague | **i18n**: CS, EN
