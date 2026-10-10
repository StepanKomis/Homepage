VEGA._HOMEPAGE_MANIFEST = {
  "name": "Homepage Homelab Dashboard",
  "repo": "git@github.com:StepanKomis/Homepage.git",
  "deployment": "home.komis.cz:4200",
  "stack": {
    "frontend": "React 18 + Vite + TypeScript",
    "backend": "Go 1.21",
    "database": "PostgreSQL 13+",
    "realtime": "WebSocket",
    "containerization": "Docker"
  },
  "services": [
    "uptime-kuma",
    "jellyfin",
    "sonarr",
    "radarr",
    "bazarr",
    "audiobookshelf",
    "honcho"
  ],
  "port": 4200,
  "timezone": "Europe/Prague",
  "languages": ["cs", "en"],
  "monitoring": {
    "kuma": "42/43 UP",
    "endpoint": "https://home.komis.cz/health"
  },
  "branch_model": {
    "main": "Production releases (tagged)",
    "dev": "Integration branch",
    "feature": "Feature development",
    "bugfix": "Bug fixes"
  }
}
