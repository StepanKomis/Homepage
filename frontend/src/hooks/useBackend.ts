import { useEffect, useRef } from 'react'
import { useDashboardStore } from '../store/dashboard'
import { fetchStatus, fetchConfig, fetchMediaData, fetchLibraryStats, type BackendService } from '../lib/integrations'
import type { ServiceStatus } from '../lib/data'

const WS_URL = import.meta.env.VITE_WS_URL || '/api/ws'

/* Derive per-app status: backend service status wins, otherwise the app's
   connectivity flag (on) and latency from the design data model. */
export function statusFor(appId: string, statuses: Record<string, ServiceStatus>): ServiceStatus {
  const s = statuses[appId]
  return s ?? 'unknown'
}

export const latencyFor = (appId: string): number | null => {
  const lats = useDashboardStore.getState().latencies
  return lats[appId] ?? null
}

export function useBackend() {
  const pollMs = useDashboardStore((s) => s.pollMs)
  const live = useDashboardStore((s) => s.live)
  const setStatuses = useDashboardStore((s) => s.setStatuses)
  const setLatencies = useDashboardStore((s) => s.setLatencies)
  const setUrls = useDashboardStore((s) => s.setUrls)
  const updateStatus = useDashboardStore((s) => s.updateStatus)
  const setMedia = useDashboardStore((s) => s.setMedia)
  const setLibrary = useDashboardStore((s) => s.setLibrary)
  const setConfig = useDashboardStore((s) => s.setConfig)
  const setLoading = useDashboardStore((s) => s.setLoading)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnect = useRef(0)

  useEffect(() => {
    let cancelled = false

    const pull = async (first: boolean) => {
      try {
        const [st, media, lib] = await Promise.allSettled([fetchStatus(), fetchMediaData(), fetchLibraryStats()])
        if (cancelled) return
        if (st.status === 'fulfilled') {
          const map: Record<string, ServiceStatus> = {}
          const lat: Record<string, number> = {}
          const urls: Record<string, string> = {}
          for (const s of st.value.services ?? []) { map[s.id] = s.status; if (s.latencyMs != null) lat[s.id] = s.latencyMs; if (s.url) urls[s.id] = s.url }
          setStatuses(map)
          setLatencies(lat)
          setUrls(urls)
        }
        if (media.status === 'fulfilled') setMedia(media.value)
        if (lib.status === 'fulfilled') setLibrary(lib.value)
      } catch {
        /* offline: mock fallbacks already in place */
      } finally {
        if (first && !cancelled) setLoading(false)
      }
    }

    fetchConfig()
      .then((c) => {
        if (!cancelled) setConfig(c)
      })
      .catch(() => {
        /* defaults stand */
      })
    void pull(true)

    const id = window.setInterval(() => void pull(false), pollMs)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [pollMs, setStatuses, updateStatus, setMedia, setLibrary, setConfig, setLoading])

  useEffect(() => {
    if (!live) {
      wsRef.current?.close()
      wsRef.current = null
      return
    }
    let closed = false

    const connect = () => {
      try {
        const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
        const ws = new WebSocket(`${proto}://${window.location.host}${WS_URL}`)
        wsRef.current = ws
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data)
            if (msg.type === 'status_update' && msg.data?.id) {
              updateStatus(msg.data.id, msg.data.status)
            } else if (msg.type === 'services' && Array.isArray(msg.data)) {
              const map: Record<string, ServiceStatus> = {}
              const lat: Record<string, number> = {}
              for (const s of msg.data as BackendService[]) { map[s.id] = s.status; if (s.latencyMs != null) lat[s.id] = s.latencyMs }
              setStatuses(map)
              setLatencies(lat)
            }
          } catch {
            /* ignore malformed frames */
          }
        }
        ws.onopen = () => {
          reconnect.current = 0
        }
        ws.onclose = () => {
          if (closed) return
          const delay = Math.min(1000 * 2 ** reconnect.current++, 30000)
          setTimeout(connect, delay)
        }
      } catch {
        /* WS unavailable: polling covers us */
      }
    }
    connect()

    return () => {
      closed = true
      wsRef.current?.close()
    }
  }, [live, updateStatus, setStatuses])
}

/* Real service URL from backend status; null when backend has none. */
export const realUrl = (appId: string): string | null => {
  return useDashboardStore.getState().urls[appId] ?? null
}
