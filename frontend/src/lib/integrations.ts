/* Typed integration layer: backend first, design mock data as fallback.
   Real integrations (Jellyfin, qBittorrent, Sonarr/Radarr, Gotify) can replace
   the fetchers here without touching components. */
import type { ServiceStatus } from './data'
import { STREAMS, TORRENTS, UPCOMING, ALERTS, type Stream, type Torrent, type UpcomingItem, type AlertItem } from './data'

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

/* Streaming / download / calendar data. The backend has no such endpoints yet,
   so the design mock constants are the fallback. Replace with real API calls
   when the integrations land. */
export interface MediaData {
  streams: Stream[]
  torrents: Torrent[]
  upcoming: UpcomingItem[]
  alerts: AlertItem[]
}

export async function fetchMediaData(): Promise<MediaData> {
  try {
    const res = await fetch(`${API_BASE}/v1/media`)
    if (!res.ok) throw new Error(`media ${res.status}`)
    const data = await res.json()
    return {
      streams: data.streams ?? STREAMS,
      torrents: data.torrents ?? TORRENTS,
      upcoming: data.upcoming ?? UPCOMING,
      alerts: data.alerts ?? ALERTS,
    }
  } catch {
    return { streams: STREAMS, torrents: TORRENTS, upcoming: UPCOMING, alerts: ALERTS }
  }
}

/* Map a backend service status to a design dot color. */
export const statusDot = (s: ServiceStatus | undefined): string =>
  s === 'online' ? 'var(--green)' : s === 'offline' ? 'var(--red)' : '#7FA8EE'

export const healthText = (s: ServiceStatus | undefined): string =>
  s === 'online' ? 'OK' : s === 'offline' ? 'Down' : 'Unknown'

export const healthColor = (s: ServiceStatus | undefined): string =>
  s === 'online' ? 'var(--green)' : s === 'offline' ? 'var(--red)' : 'var(--subtle)'

export const LAT = { jellyfin: 18, seerr: 22, immich: 31, abs: 14, navidrome: 9, sonarr: 12, radarr: 13, prowlarr: 640, qbit: 8, n8n: 26, portainer: 19, tailscale: 88, npm: 7, kuma: 11, grafana: 24, pihole: 4, nextcloud: 142, mealie: 17, dawarich: 35, gotify: 6 } as Record<string, number>
