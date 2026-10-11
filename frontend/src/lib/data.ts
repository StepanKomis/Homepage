/* Data model and app catalog. All runtime data comes from the backend API. */

import { ICONS } from './icons'

const D = 'example.dev'

export type ServiceStatus = 'online' | 'offline' | 'unknown'

export interface AppDef {
  cat: string
  id: string
  name: string
  url: string
  api: string
  auth: string
  on: boolean
  stat: string
  page: string | null
  hint: string
  icon: string
  hue: string
  tint: string
}

export const APPICON: Record<string, string> = { jellyfin: 'film', seerr: 'inbox', immich: 'image', abs: 'headphones', navidrome: 'music', sonarr: 'tv', radarr: 'clapper', prowlarr: 'search', qbit: 'download', n8n: 'workflow', portainer: 'box', tailscale: 'network', npm: 'globe', kuma: 'activity', grafana: 'chart', pihole: 'shield', nextcloud: 'cloud', mealie: 'utensils', dawarich: 'pin', gotify: 'bell' }

const HUES: Record<string, string> = { jellyfin: '#7A5AF0', seerr: '#5B5BD6', immich: '#E0703A', abs: '#C9921B', navidrome: '#D0457A', sonarr: '#0E9BC4', radarr: '#E5A124', prowlarr: '#E05A5A', qbit: '#2F6FE4', n8n: '#EA4B71', portainer: '#13A8D9', tailscale: '#6A78D1', npm: '#F15833', kuma: '#2FAE6B', grafana: '#F28C28', pihole: '#D9534F', nextcloud: '#0082C9', mealie: '#E58325', dawarich: '#2BA58D', gotify: '#3E7BE6' }

type AppRow = [string, string, string, string, string, string, boolean, string, string | null, string]

const APP_ROWS: AppRow[] = [
  ['Media', 'jellyfin', 'Jellyfin', 'jellyfin', 'GET /Sessions · /Items/Counts', 'X-Emby-Token', true, '3 streams · 1,284 movies', 'jellyfin', 'Dashboard → API Keys'],
  ['Media', 'seerr', 'Jellyseerr', 'requests', 'GET /api/v1/request', 'X-Api-Key', true, '3 requests pending', 'seerr', 'Settings → General → API Key'],
  ['Media', 'immich', 'Immich', 'photos', 'GET /api/server/statistics', 'x-api-key', true, '48,210 photos · 612 videos', null, 'Account Settings → API Keys'],
  ['Media', 'abs', 'Audiobookshelf', 'books', 'GET /api/libraries', 'Authorization: ***', true, '214 books · 1 listening', null, 'Settings → Users → API token'],
  ['Media', 'navidrome', 'Navidrome', 'music', 'GET /rest/getNowPlaying', 'Subsonic token (u, t, s)', false, '', null, 'your Navidrome login'],
  ['Downloads & automation', 'sonarr', 'Sonarr', 'sonarr', 'GET /api/v3/calendar · /queue', 'X-Api-Key', true, '6 airing this week', 'arr', 'Settings → General → Security'],
  ['Downloads & automation', 'radarr', 'Radarr', 'radarr', 'GET /api/v3/calendar · /queue', 'X-Api-Key', true, '2 releases · 2 in queue', 'arr', 'Settings → General → Security'],
  ['Downloads & automation', 'prowlarr', 'Prowlarr', 'prowlarr', 'GET /api/v1/indexerstats', 'X-Api-Key', true, '9 indexers · 1 failing', null, 'Settings → General → Security'],
  ['Downloads & automation', 'qbit', 'qBittorrent', 'qbit', 'GET /api/v2/torrents/info', 'Web UI login (SID cookie)', true, '4 active torrents', 'qbit', 'Web UI username & password'],
  ['Downloads & automation', 'n8n', 'n8n', 'n8n', 'GET /api/v1/executions', 'X-N8N-API-KEY', true, '41 runs today · 0 failed', null, 'Settings → n8n API'],
  ['Network & infra', 'portainer', 'Portainer', 'portainer', 'GET /api/endpoints/{id}/docker/containers/json', 'X-API-Key', true, '23 containers · 1 stopped', null, 'My account → Access tokens'],
  ['Network & infra', 'tailscale', 'Tailscale', 'api.tailscale.com', 'GET /api/v2/tailnet/-/devices', 'Authorization: ***', true, '6 devices online', null, 'Admin console → Settings → Keys'],
  ['Network & infra', 'npm', 'Nginx Proxy Manager', 'proxy', 'GET /api/nginx/proxy-hosts', 'Bearer (POST /api/tokens)', true, '18 hosts · 1 cert expiring', null, 'your NPM admin login'],
  ['Network & infra', 'kuma', 'Uptime Kuma', 'status', 'GET /metrics', 'Basic auth (API key)', true, '21 of 22 monitors up', null, 'Settings → API Keys'],
  ['Network & infra', 'grafana', 'Grafana', 'grafana', 'GET /api/search', 'Bearer (service account)', true, '7 dashboards', null, 'Administration → Service accounts'],
  ['Network & infra', 'pihole', 'Pi-hole', 'dns', 'GET /api/stats/summary', 'sid via POST /api/auth', true, '18.4% queries blocked', null, 'Settings → Web interface / API → App password'],
  ['Home & productivity', 'nextcloud', 'Nextcloud', 'cloud', 'GET /ocs/v2.php/apps/serverinfo/api/v1/info', 'NC-Token', true, '412 GB used · 3 users', null, 'occ config:app:set serverinfo token'],
  ['Home & productivity', 'mealie', 'Mealie', 'recipes', 'GET /api/households/mealplans/today', 'Authorization: ***', false, '', null, 'User profile → API tokens'],
  ['Home & productivity', 'dawarich', 'Dawarich', 'where', 'GET /api/v1/stats', 'api_key query param', false, '', null, 'Account → API key'],
  ['Home & productivity', 'gotify', 'Gotify', 'push', 'GET /message · WS /stream', 'X-Gotify-Key', true, '3 unread alerts', 'alerts', 'Clients → Create client'],
]

export const APPS: AppDef[] = APP_ROWS.map(([cat, id, name, sub, api, auth, on, stat, page, hint]) => ({
  cat, id, name, url: sub.includes('.') ? sub : `${sub}.${D}`, api, auth, on, stat, page, hint,
  icon: ICONS[APPICON[id]], hue: HUES[id],
  tint: `color-mix(in srgb, ${HUES[id]} 16%, transparent)`,
}))

export const CATS = ['Media', 'Downloads & automation', 'Network & infra', 'Home & productivity']

export interface Stream {
  id: number
  user: string
  title: string
  sub: string
  client: string
  mode: string
  pos: number
  dur: number
}


export type TorrentState = 'downloading' | 'stalled' | 'seeding' | 'paused'

export interface Torrent {
  id: number
  name: string
  size: number
  prog: number
  dl: number
  ul: number
  st: TorrentState
  cat: string
}


export interface UpcomingItem {
  day: string
  time: string
  title: string
  ep: string
  src: string
}


export interface AlertItem {
  app: string
  title: string
  msg: string
  t: string
  prio: number
}



export const ST: Record<TorrentState, [string, string]> = {
  downloading: ['Downloading', '#1F5FD1'],
  stalled: ['Stalled', 'var(--amber)'],
  seeding: ['Seeding', 'var(--green)'],
  paused: ['Paused', 'var(--subtle)'],
}


export const BESPOKE: Record<string, string> = { jellyfin: 'jellyfin', seerr: 'seerr', sonarr: 'arr', radarr: 'arr', qbit: 'qbit', gotify: 'alerts' }
export const pageOf = (id: string): string => BESPOKE[id] || 'app:' + id

export const mmss = (m: number): string =>
  `${Math.floor(m / 60) ? Math.floor(m / 60) + ':' : ''}${String(Math.floor(m % 60)).padStart(Math.floor(m / 60) ? 2 : 1, '0')}:00`

export const stripeImage = 'linear-gradient(45deg,rgba(255,255,255,.25) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.25) 50%,rgba(255,255,255,.25) 75%,transparent 75%)'
