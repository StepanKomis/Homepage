# Deployment Guide

## Home.komis.cz Deployment

The application is deployed on bigboi (OVH) via Docker to `home.komis.cz:4200`, proxied through nginx.

### Prerequisites

- Docker & Docker Compose installed on bigboi
- PostgreSQL accessible
- SSL certificate for home.komis.cz

### Setup Steps

1. **Clone repository on bigboi**
   ```bash
   ssh bigboi
   cd /srv
   git clone git@github.com:StepanKomis/Homepage.git
   cd Homepage
   ```

2. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with proper URLs and credentials
   ```

3. **Deploy with Docker Compose**
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

4. **Nginx configuration**
   ```nginx
   server {
       listen 80;
       server_name home.komis.cz;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name home.komis.cz;

       ssl_certificate /etc/letsencrypt/live/home.komis.cz/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/home.komis.cz/privkey.pem;

       location / {
           proxy_pass http://localhost:4200;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

5. **Monitoring Setup**
   - Add to Uptime Kuma: `https://home.komis.cz/health`
   - Add to Gotify notifications

### Rollback

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### Logs

```bash
docker compose -f docker-compose.prod.yml logs -f backend
```
