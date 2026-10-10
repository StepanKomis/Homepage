# Homepage deployment to VEGA via nginx

## Prerequisites

Homepage v1.0.2 is ready. Must run on VEGA or JARVIS (public-facing).

## On VEGA

1. **Get Docker image** (one of):
   - Build locally: `docker build -t homepage:v1.0.2 . < git clone https://github.com/StepanKomis/Homepage.git`
   - Or push to Docker Hub and pull from there

2. **Copy nginx vhost**:
   ```
   cp nginx/home.komis.cz.conf /srv/nginx/conf.d/home.komis.cz.conf
   ```

3. **Issue certificate** (if DNS `home.komis.cz` is DNS-only on Cloudflare):
   ```
   certbot certonly --webroot -w /srv/nginx/certbot/www -d home.komis.cz --non-interactive --agree-tos --keep-until-expiring
   ```

4. **Reload nginx**:
   ```
   docker exec nginx nginx -t && docker exec nginx nginx -s reload
   ```

5. **Run Homepage container** (modify for your network):
   ```
   docker run -d \
     --name homepage \
     -p 4200:4200 \
     -e DATABASE_URL="postgres://homepage:homepage@postgres:5432/homepage" \
     -e JELLYFIN_URL="http://100.77.76.47:8096" \
     -e SONARR_URL="http://100.77.76.47:8989" \
     -e RADARR_URL="http://100.77.76.47:7878" \
     -e BAZARR_URL="http://100.77.76.47:6767" \
     homepage:v1.0.2
   ```
   Or use docker-compose.vega.yml

6. **Test**:
   ```
   curl -s https://home.komis.cz/api/services | jq .
   ```

## Cloudflare Configuration

Make sure `home.komis.cz` is set to:
- **DNS only** (grey cloud) so VEGA nginx receives the traffic directly
- Not orange-cloud proxied (that causes 421 misdirected errors)

Once VEGA has valid SSL cert, can switch to orange cloud if desired.

## Integration

- Frontend: React 18 + TypeScript + bilingual (CS/EN)
- Backend: Go 1.21 + REST API + WebSocket
- Database: PostgreSQL
- Integrations: Uptime Kuma, Jellyfin, Sonarr, Radarr, Bazarr, Audiobookshelf (via Tailscale IPs)

GitHub: https://github.com/StepanKomis/Homepage
Latest: v1.0.2
