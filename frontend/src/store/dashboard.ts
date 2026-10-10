import { create } from 'zustand'

interface Service {
  id: string
  name: string
  status: 'online' | 'offline' | 'unknown'
  icon: string
  url?: string
  lastUpdate: number
  metadata?: Record<string, any>
}

interface DashboardStore {
  services: Service[]
  loading: boolean
  error: string | null
  setServices: (services: Service[]) => void
  updateService: (id: string, service: Partial<Service>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  services: [],
  loading: true,
  error: null,
  setServices: (services) => set({ services }),
  updateService: (id, service) =>
    set((state) => ({
      services: state.services.map((s) =>
        s.id === id ? { ...s, ...service } : s
      ),
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))
