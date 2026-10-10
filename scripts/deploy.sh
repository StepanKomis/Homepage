#!/bin/bash
# Deploy Homepage to home.komis.cz
# Run this on bigboi after SSH in

set -euo pipefail

REPO_DIR="/srv/Homepage"
DEPLOY_USER="deploy"

echo "[*] Homepage Deploy Script"
echo "[*] Deploying to home.komis.cz on $(date)"

# Clone or update repo
if [ -d "$REPO_DIR" ]; then
    echo "[*] Updating repository..."
    cd "$REPO_DIR"
    git fetch origin
    git reset --hard origin/main
else
    echo "[*] Cloning repository..."
    git clone git@github.com:StepanKomis/Homepage.git "$REPO_DIR"
    cd "$REPO_DIR"
fi

# Prepare environment
echo "[*] Preparing environment..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "[!] .env created - EDIT BEFORE DEPLOYING"
    exit 1
fi

# Build with Docker
echo "[*] Building Docker image..."
docker compose -f docker-compose.prod.yml build

# Stop old container
echo "[*] Stopping old containers..."
docker compose -f docker-compose.prod.yml down || true

# Start new containers
echo "[*] Starting services..."
docker compose -f docker-compose.prod.yml up -d

# Wait for health check
echo "[*] Waiting for services to be healthy..."
for i in {1..30}; do
    if curl -f http://localhost:4200/health > /dev/null 2>&1; then
        echo "[+] Services are healthy"
        break
    fi
    echo "[*] Attempt $i/30..."
    sleep 2
done

# Verify nginx
echo "[*] Verifying nginx configuration..."
if sudo nginx -t 2>/dev/null; then
    echo "[+] Nginx configuration valid"
    sudo systemctl reload nginx
else
    echo "[!] Nginx configuration error - MANUAL FIX NEEDED"
    exit 1
fi

echo "[+] Deployment complete!"
echo "[+] Application available at https://home.komis.cz"

# Notify monitoring
curl -X POST "https://kuma.komis.cz/api/push/homepage" \
    -d "status=up" \
    2>/dev/null || true

exit 0
