/* Typed integration layer: backend first, design mock data as fallback.
   Real integrations (Jellyfin, qBittorrent, Sonarr/Radarr, Gotify) can replace
   the fetchers here without touching components. */
import type { ServiceStatus } from './data'
import { STREAMS, TORRENTS, UPCOMING, ALERTS, type Stream, type Torrent, type TorrentState, type UpcomingItem, type AlertItem } from './data'

export const API_BASE = import.meta.env.VITE_API_URL || '/api'

export interface BackendStatus {
  services: BackendService[]
}
export interface BackendService {
  id: string
  name: string
  status: ServiceStatus
  icon?: string
  url?: string
  lastUpdate?: number
  metadata?: Record<string, unknown>
}

export interface BackendConfig {
  poll_interval_seconds?: number
  theme?: 'light' | 'dark'
  overview_layout?: 'grid' | 'pipeline' | 'wall'
  live_updates?: boolean
}

export async function fetchStatus(): Promise<BackendStatus> {
  const res = await fetch(`${API_BASE}/v1/status`)
  if (!res.ok) throw new Error(`status ${res.status}`)
  return res.json()
}

export async function fetchConfig(): Promise<BackendConfig> {
  const res = await fetch(`${API_BASE}/v1/config`)
  if (!res.ok) throw new Error(`config ${res.status}`)
  return res.json()
}

export async function testIntegration(serviceId: string, url: string, apiKey: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/v1/integration/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_id: serviceId, url, api_key: apiKey }),
    })
    if (!res.ok) throw new Error(`test ${res.status}`)
    return { ok: true, message: 'ok' }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'failed' }
  }
}

/* Streaming / download / calendar data from the live backend endpoints.
   Design mock constants remain the fallback while the backend endpoint is
   unreachable or the source service has no data yet. */
export interface MediaData {
  streams: Stream[]
  torrents: Torrent[]
  upcoming: UpcomingItem[]
  alerts: AlertItem[]
}

export interface LibraryStat {
  label: string
  value: string | number
}

async function getJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

/* Backend rows are loosely typed maps; normalize them to the design shapes. */
type Row = Record<string, unknown>

const str = (v: unknown, dflt = ''): string => (typeof v === 'string' ? v : v != null ? String(v) : dflt)
const num = (v: unknown, dflt = 0): number => (typeof v === 'number' ? v : v != null ? Number(v) || 0 : dflt)

function mapStream(r: Row, i: number): Stream {
  const mode = str(r.paused) === 'true' || r.paused === true ? 'Paused' : 'Direct play'
  const series = str(r.series)
  const ep = str(r.ep)
  return {
    id: num(r.id, i + 1),
    user: str(r.user, 'unknown'),
    title: series ? `${series} · ${str(r.title)}` : str(r.title),
    sub: series ? (ep || 'Episode') : str(r.year) ? String(num(r.year)) : 'Movie',
    client: str(r.client, str(r.device, 'Client')),
    mode,
    pos: num(r.progress),
    dur: 0,
  }
}

function mapTorrent(r: Row, i: number): Torrent {
  const stMap: Record<string, TorrentState> = {
    downloading: 'downloading', stalled: 'stalled', done: 'seeding',
    paused: 'paused', queued: 'stalled', error: 'stalled',
  }
  const st = stMap[str(r.status, 'downloading')] ?? 'downloading'
  const speed = num(r.speed) / 1e6
  return {
    id: num(r.id, i + 1),
    name: str(r.name),
    size: num(r.size) / 1e9,
    prog: num(r.progress),
    dl: st === 'downloading' ? speed : 0,
    ul: 0,
    st,
    cat: str(r.category, str(r.eta, '')),
  }
}

function mapUpcoming(r: Row, i: number): UpcomingItem {
  const day = str(r.day)
  const d = new Date(day + 'T00:00:00')
  const today = new Date().toISOString().slice(0, 10)
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10)
  const dayLabel = day === today ? 'Today' : day === tomorrow ? 'Tomorrow' : d.toLocaleDateString('en', { weekday: 'short' })
  return {
    day: dayLabel,
    time: str(r.when, 'Digital'),
    title: str(r.title),
    ep: str(r.ep) || str(r.year) || '',
    src: str(r.source, 'Sonarr'),
  }
}

function mapAlert(r: Row, i: number): AlertItem {
  const d = new Date(str(r.date))
  return {
    app: 'Gotify',
    title: str(r.title),
    msg: str(r.message),
    t: isNaN(d.getTime()) ? '' : d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
    prio: 5,
  }
}

export async function fetchMediaData(): Promise<MediaData> {
  const [streams, torrents, upcoming, alerts] = await Promise.all([
    getJSON<{ streams: Row[] | null }>('/v1/streams'),
    getJSON<{ torrents: Row[] | null }>('/v1/torrents'),
    getJSON<{ upcoming: Row[] | null }>('/v1/upcoming'),
    getJSON<{ alerts: Row[] | null }>('/v1/alerts'),
  ])
  return {
    streams: streams?.streams?.map(mapStream) ?? STREAMS,
    torrents: torrents?.torrents?.map(mapTorrent) ?? TORRENTS,
    upcoming: upcoming?.upcoming?.map(mapUpcoming) ?? UPCOMING,
    alerts: alerts?.alerts?.map(mapAlert) ?? ALERTS,
  }
}

export async function fetchLibraryStats(): Promise<LibraryStat[] | null> {
  const data = await getJSON<{ stats: LibraryStat[] | null }>('/v1/library')
  return data?.stats ?? null
}

/* Map a backend service status to a design dot color. */
export const statusDot = (s: ServiceStatus | undefined): string =>
  s === 'online' ? 'var(--green)' : s === 'offline' ? 'var(--red)' : '#7FA8EE'

export const healthText = (s: ServiceStatus | undefined): string =>
  s === 'online' ? 'OK' : s === 'offline' ? 'Down' : 'Unknown'

export const healthColor = (s: ServiceStatus | undefined): string =>
  s === 'online' ? 'var(--green)' : s === 'offline' ? 'var(--red)' : 'var(--subtle)'

export const LAT = { jellyfin: 18, seerr: 22, immich: 31, abs: 14, navidrome: 9, sonarr: 12, radarr: 13, prowlarr: 640, qbit: 8, n8n: 26, portainer: 19, tailscale: 88, npm: 7, kuma: 11, grafana: 24, pihole: 4, nextcloud: 142, mealie: 17, dawarich: 35, gotify: 6 } as Record<string, number>
