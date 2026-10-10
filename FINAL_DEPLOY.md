# Homepage — FINAL DEPLOYMENT

Homepage backend běží na **BIGBOI** (100.77.76.47:4200), stejně jako Jellyfin/Sonarr/atd.
VEGA (57.129.13.228) nginx proxy forwarduje `home.komis.cz` → bigboi.

## Na BIGBOI (docker-compose)

```bash
cd /srv/Homepage
docker compose -f docker-compose.prod.yml up -d
```

Verify:
```bash
curl -s http://localhost:4200/api/services | jq .
```

## Na VEGA nginx

1. **Copy vhost config:**
```bash
cp /root/workspace/Homepage/nginx/home.komis.cz.conf /srv/nginx/conf.d/
```

2. **Cert (if needed):**
```bash
certbot certonly -d home.komis.cz --webroot -w /srv/nginx/certbot/www
```

3. **Reload nginx:**
```bash
docker exec nginx nginx -t && docker exec nginx nginx -s reload
```

4. **Test:**
```bash
curl -s https://home.komis.cz/api/services
```

## Cloudflare

`home.komis.cz` must be:
- Orange Cloud (proxied) ✓
- SSL/TLS: Full
- DNS: 57.129.13.228 (VEGA)

## Architecture

```
Cloudflare Orange Cloud
        ↓ CF-Connecting-IP header
VEGA nginx (57.129.13.228:443)
        ↓ proxy_pass to Tailscale
Bigboi (100.77.76.47:4200)
        ↓
Homepage backend + PostgreSQL
        ↓
Tailscale IPs:
  - Jellyfin 100.77.76.47:8096
  - Sonarr 100.77.76.47:8989
  - Radarr 100.77.76.47:7878
  - Bazarr 100.77.76.47:6767
```

Same pattern as jellyfin.komis.cz, radarr.komis.cz, etc.
