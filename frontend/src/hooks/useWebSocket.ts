import { useEffect, useRef, useCallback } from 'react'
import { useDashboardStore } from '../store/dashboard'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4200/api/ws'

export const useWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null)
  const { setServices, updateService, setError } = useDashboardStore()
  const reconnectAttempts = useRef(0)

  useEffect(() => {
    const connect = () => {
      try {
        wsRef.current = new WebSocket(WS_URL)

        wsRef.current.onopen = () => {
          console.log('WebSocket connected')
          reconnectAttempts.current = 0
        }

        wsRef.current.onmessage = (event) => {
          const message = JSON.parse(event.data)
          if (message.type === 'status_update') {
            updateService(message.data.id, {
              status: message.data.status,
              lastUpdate: Date.now(),
              metadata: message.data.metadata,
            })
          } else if (message.type === 'services') {
            setServices(message.data)
          }
        }

        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error)
          setError('Connection lost')
        }

        wsRef.current.onclose = () => {
          console.log('WebSocket disconnected')
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          reconnectAttempts.current++
          setTimeout(connect, delay)
        }
      } catch (err) {
        console.error('WebSocket connection failed:', err)
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
        reconnectAttempts.current++
        setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [setServices, updateService, setError])

  return wsRef.current
}
