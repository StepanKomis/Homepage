# Homepage Development

## Local Development Setup

### Prerequisites

- Node.js 18+
- Go 1.21+
- Docker & Docker Compose
- PostgreSQL 13+

### Quick Start

```bash
# 1. Start PostgreSQL
docker compose -f docker-compose.dev.yml up -d

# 2. Frontend (Terminal 1)
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173

# 3. Backend (Terminal 2)
cd backend
go mod download
go run main.go
# Runs on http://localhost:4200
```

### Environment Setup

```bash
# Copy and configure
cp .env.example .env
cp .env.example .env.local

# Edit with your test URLs:
# - Use local/test service URLs
# - Set DATABASE_URL for your PostgreSQL
```

### Development Workflow

1. **Create feature branch from dev**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/my-feature
   ```

2. **Code and commit**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

3. **Push and create PR against dev**
   ```bash
   git push origin feature/my-feature
   # Then open PR on GitHub against dev
   ```

### Testing

#### Frontend
```bash
cd frontend
npm run test
npm run lint
npm run type-check
```

#### Backend
```bash
cd backend
go test ./...
go vet ./...
```

### Database

#### Connect to PostgreSQL
```bash
psql postgres://homepage:homepage@localhost:5432/homepage
```

#### View schema
```sql
\dt
SELECT * FROM services;
SELECT * FROM health_checks;
```

### WebSocket Testing

```bash
# Using websocat or wscat
wscat -c ws://localhost:4200/api/ws
```

### API Testing

```bash
# Get all services
curl http://localhost:4200/api/v1/status

# Get specific service
curl http://localhost:4200/api/v1/services/jellyfin

# Test integration
curl -X POST http://localhost:4200/api/v1/integration/test \
  -H "Content-Type: application/json" \
  -d '{"service_id": "jellyfin"}'
```

### Troubleshooting

**PostgreSQL connection refused**
```bash
docker compose -f docker-compose.dev.yml restart postgres
```

**Port already in use**
```bash
lsof -i :4200  # Find process on port 4200
kill -9 <PID>
```

**Go mod issues**
```bash
cd backend
go clean -modcache
go mod download
```

### Code Style

- Frontend: ESLint + Prettier (auto on commit via pre-commit hook in future)
- Backend: `gofmt` and `golangci-lint`
- No em-dashes (`—`) in code

### Hot Reload

- Frontend: Vite provides automatic hot reload
- Backend: Use `air` for hot reload
  ```bash
  go install github.com/cosmtrek/air@latest
  cd backend && air
  ```
