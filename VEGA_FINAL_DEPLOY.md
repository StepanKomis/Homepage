# Homepage VEGA Deployment — Final

## On VEGA (57.129.13.228)

### 1. Clone & Build

```bash
cd /srv
git clone https://github.com/StepanKomis/Homepage.git
cd Homepage
docker build -t homepage:v1.1.0 .
```

### 2. Setup Directories

```bash
mkdir -p /srv/homepage/db /srv/nginx/conf.d
chmod 755 /srv/homepage/db
```

### 3. Copy Nginx Vhost (Cloudflare Orange Cloud + Real IP)

```bash
cp /srv/Homepage/nginx/home.komis.cz.conf /srv/nginx/conf.d/
```

**Note:** Config includes Cloudflare IP ranges + `real_ip_header CF-Connecting-IP` to handle Orange Cloud proxy.

### 4. SSL Certificate

If using certbot (already on VEGA):
```bash
certbot certonly \
  --webroot -w /srv/nginx/certbot/www \
  -d home.komis.cz \
  --non-interactive --agree-tos --keep-until-expiring
```

Or copy existing cert from another domain if available.

### 5. Run Homepage

```bash
cd /srv/Homepage
docker compose -f docker-compose.vega.yml up -d
```

Verify:
```bash
docker ps | grep homepage
curl -s http://127.0.0.1:4200/health
```

### 6. Reload Nginx

```bash
docker exec nginx nginx -t
docker exec nginx nginx -s reload
```

### 7. Test

```bash
curl -s https://home.komis.cz/api/services
```

## Cloudflare Settings

**home.komis.cz** must be:
- **Orange Cloud (proxied)** ✓ — nginx vhost handles Cloudflare headers
- **SSL/TLS Mode**: Full (or Full Strict if you trust the cert)
- **DNS Points to**: VEGA public IP (57.129.13.228)

## Service Integration

Homepage backend auto-discovers (via Tailscale):
- Jellyfin @ 100.77.76.47:8096
- Sonarr @ 100.77.76.47:8989
- Radarr @ 100.77.76.47:7878
- Bazarr @ 100.77.76.47:6767
- Audiobookshelf @ 100.77.76.47:13378
- Uptime Kuma @ 100.77.76.47:3001

## Troubleshooting

- **421 Misdirected Request**: SSL cert not valid for origin. Check certbot, cert dates, domain mismatch.
- **Connection refused on proxy**: Backend services on Tailscale only. Verify 100.77.76.47 reachable from VEGA.
- **Nginx reload fails**: `docker exec nginx nginx -t` to validate config syntax.

## Status

All code in: https://github.com/StepanKomis/Homepage (v1.1.0)
Deployment verified on local test (Godzilla).
Ready for VEGA production.
