import { useEffect, useRef } from 'react'
import { useDashboardStore } from '../store/dashboard'
import { fetchStatus, fetchConfig, fetchMediaData, type BackendService, LAT } from '../lib/integrations'
import type { ServiceStatus } from '../lib/data'
import { APPS } from '../lib/data'

const WS_URL = import.meta.env.VITE_WS_URL || '/api/ws'

/* Derive per-app status: backend service status wins, otherwise the app's
   connectivity flag (on) and latency from the design data model. */
export function statusFor(appId: string, statuses: Record<string, ServiceStatus>): ServiceStatus {
  const s = statuses[appId]
  if (s) return s
  const app = APPS.find((a) => a.id === appId)
  return app && !app.on ? 'unknown' : 'online'
}

export const latencyFor = (appId: string): number | null => {
  const app = APPS.find((a) => a.id === appId)
  if (app && !app.on) return null
  return LAT[appId] ?? null
}

export function useBackend() {
  const pollMs = useDashboardStore((s) => s.pollMs)
  const live = useDashboardStore((s) => s.live)
  const setStatuses = useDashboardStore((s) => s.setStatuses)
  const updateStatus = useDashboardStore((s) => s.updateStatus)
  const setMedia = useDashboardStore((s) => s.setMedia)
  const setConfig = useDashboardStore((s) => s.setConfig)
  const setLoading = useDashboardStore((s) => s.setLoading)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnect = useRef(0)

  useEffect(() => {
    let cancelled = false

    const pull = async (first: boolean) => {
      try {
        const [st, media] = await Promise.allSettled([fetchStatus(), fetchMediaData()])
        if (cancelled) return
        if (st.status === 'fulfilled') {
          const map: Record<string, ServiceStatus> = {}
          for (const s of st.value.services ?? []) map[s.id] = s.status
          setStatuses(map)
        }
        if (media.status === 'fulfilled') setMedia(media.value)
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
  }, [pollMs, setStatuses, updateStatus, setMedia, setConfig, setLoading])

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
              for (const s of msg.data as BackendService[]) map[s.id] = s.status
              setStatuses(map)
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
