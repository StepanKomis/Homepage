import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDashboardStore, type Layout } from './store/dashboard'
import { useBackend } from './hooks/useBackend'
import { setTheme } from './lib/theme'
import Sidebar from './components/Sidebar'
import OverviewGrid from './components/OverviewGrid'
import OverviewPipeline from './components/OverviewPipeline'
import OverviewWall from './components/OverviewWall'
import ServicesList from './components/ServicesList'
import ConnectModal from './components/ConnectModal'

function App(): JSX.Element {
  const { t } = useTranslation()
  const layout = useDashboardStore((s) => s.layout)
  const setLayout = useDashboardStore((s) => s.setLayout)
  const live = useDashboardStore((s) => s.live)
  const setLive = useDashboardStore((s) => s.setLive)
  const theme = useDashboardStore((s) => s.theme)
  const toggleTheme = useDashboardStore((s) => s.toggleTheme)
  const connected = useDashboardStore((s) => s.connected)
  const media = useDashboardStore((s) => s.media)
  const [modal, setModal] = useState<string | null>(null)

  useBackend()

  useEffect(() => {
    setTheme(theme)
  }, [theme])

  const unread = media.alerts.length

  const switcher = (
    <div className="seg" role="tablist" aria-label="Overview layout">
      {(['grid', 'pipeline', 'wall'] as Layout[]).map((l) => (
        <button key={l} className={layout === l ? 'active' : ''} onClick={() => setLayout(l)}>
          {t(`overview.${l}`)}
        </button>
      ))}
    </div>
  )

  const header = (
    <header className="page-header">
      <div>
        <h1>{t('overview.title')}</h1>
        <p className="page-sub">
          <span className="live-badge"><span className="live-dot" /> {t('app.live')}</span>
          {t('overview.connectedOf', { connected: Object.values(connected).filter(Boolean).length, total: 20, unread })}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button className="btn btn-ghost" style={{ padding: '7px 12px' }} onClick={() => setLive(!live)}>
          {live ? 'LIVE on' : 'LIVE off'}
        </button>
        {switcher}
      </div>
    </header>
  )

  const openModal = (id: string): void => setModal(id)

  return (
    <>
      <Sidebar />
      <main className="main">
        {header}
        {layout === 'grid' && <OverviewGrid />}
        {layout === 'pipeline' && <OverviewPipeline />}
        {layout === 'wall' && <OverviewWall onOpen={openModal} />}
        <ServicesList onOpen={openModal} />
      </main>
      {modal && <ConnectModal appId={modal} onClose={() => setModal(null)} />}
    </>
  )
}

export default App
