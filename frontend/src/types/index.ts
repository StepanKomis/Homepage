export interface Service {
  id: string
  name: string
  status: 'online' | 'offline' | 'unknown'
  icon: string
  url?: string
  lastUpdate: number
  metadata?: Record<string, any>
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
