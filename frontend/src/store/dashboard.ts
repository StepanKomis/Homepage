import { create } from 'zustand'
import type { BackendConfig, MediaData } from '../lib/integrations'
import type { ServiceStatus } from '../lib/data'

export type Layout = 'grid' | 'pipeline' | 'wall'
export type Theme = 'light' | 'dark'
export type Page = 'overview' | 'apps' | string

interface ConnectModal {
  appId: string | null
  url: string
  key: string
  phase: 'form' | 'testing' | 'ok' | 'err'
  errText: string
}

interface DashboardStore {
  page: Page
  layout: Layout
  theme: Theme
  live: boolean
  pollMs: number
  connected: Record<string, boolean>
  statuses: Record<string, ServiceStatus>
  media: MediaData
  loading: boolean
  query: string
  modal: ConnectModal
  setPage: (p: Page) => void
  setLayout: (l: Layout) => void
  toggleTheme: () => void
  setLive: (v: boolean) => void
  setConfig: (c: BackendConfig) => void
  setConnected: (id: string, v: boolean) => void
  setStatuses: (s: Record<string, ServiceStatus>) => void
  updateStatus: (id: string, status: ServiceStatus) => void
  setMedia: (m: MediaData) => void
  setLoading: (v: boolean) => void
  setQuery: (q: string) => void
  openModal: (appId: string) => void
  setModalUrl: (u: string) => void
  setModalKey: (k: string) => void
  setModalPhase: (p: ConnectModal['phase'], errText?: string) => void
  closeModal: () => void
}

const storedTheme = (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) as Theme | null

export const useDashboardStore = create<DashboardStore>((set) => ({
  page: 'overview',
  layout: (typeof localStorage !== 'undefined' && (localStorage.getItem('layout') as Layout)) || 'grid',
  theme: storedTheme || 'light',
  live: true,
  pollMs: 30000,
  connected: {},
  statuses: {},
  media: { streams: [], torrents: [], upcoming: [], alerts: [] },
  loading: true,
  query: '',
  modal: { appId: null, url: '', key: '', phase: 'form', errText: '' },
  setPage: (page) => set({ page }),
  setLayout: (layout) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('layout', layout)
    set({ layout })
  },
  toggleTheme: () =>
    set((s) => {
      const theme = s.theme === 'light' ? 'dark' : 'light'
      if (typeof localStorage !== 'undefined') localStorage.setItem('theme', theme)
      return { theme }
    }),
  setLive: (live) => set({ live }),
  setConfig: (c) =>
    set(() => ({
      pollMs: c.poll_interval_seconds ? Math.max(5, c.poll_interval_seconds) * 1000 : 30000,
      live: c.live_updates !== false,
      ...(c.overview_layout ? { layout: c.overview_layout } : {}),
    })),
  setConnected: (id, v) => set((s) => ({ connected: { ...s.connected, [id]: v } })),
  setStatuses: (statuses) => set({ statuses }),
  updateStatus: (id, status) => set((s) => ({ statuses: { ...s.statuses, [id]: status } })),
  setMedia: (media) => set({ media }),
  setLoading: (loading) => set({ loading }),
  setQuery: (query) => set({ query }),
  openModal: (appId) => set({ modal: { appId, url: '', key: '', phase: 'form', errText: '' } }),
  setModalUrl: (url) => set((s) => ({ modal: { ...s.modal, url } })),
  setModalKey: (key) => set((s) => ({ modal: { ...s.modal, key } })),
  setModalPhase: (phase, errText = '') => set((s) => ({ modal: { ...s.modal, phase, errText } })),
  closeModal: () => set({ modal: { appId: null, url: '', key: '', phase: 'form', errText: '' } }),
}))
