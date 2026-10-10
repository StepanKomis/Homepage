import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon, ICONS } from '../lib/icons'
import { APPS, CATS, pageOf, type AppDef, type ServiceStatus } from '../lib/data'
import { useDashboardStore, type Page } from '../store/dashboard'
import { statusFor } from '../hooks/useBackend'

const MAIN: { page: Page; labelKey: string; icon: string }[] = [
  { page: 'overview', labelKey: 'nav.overview', icon: 'grid' },
  { page: 'apps', labelKey: 'nav.apps', icon: 'layers' },
]

const NAV_ICONS: Record<string, string> = {
  Media: 'film',
  'Downloads & automation': 'download',
  'Network & infra': 'network',
  'Home & productivity': 'home',
}

export default function Sidebar() {
  const { t } = useTranslation()
  const page = useDashboardStore((s) => s.page)
  const setPage = useDashboardStore((s) => s.setPage)
  const theme = useDashboardStore((s) => s.theme)
  const toggleTheme = useDashboardStore((s) => s.toggleTheme)
  const statuses = useDashboardStore((s) => s.statuses)
  const connected = useDashboardStore((s) => s.connected)
  const media = useDashboardStore((s) => s.media)

  const groupItems = (cat: string): AppDef[] => APPS.filter((a) => a.cat === cat)
  const countOf = (a: AppDef): string => {
    const st = statusFor(a.id, statuses)
    if (st === 'online' && (connected[a.id] ?? a.on)) return t('services.status_online')
    if (st === 'offline') return t('services.status_offline')
    return t('services.status_unknown')
  }

  const VPS = [
    { label: t('vps.cpu'), w: 31, text: '31%' },
    { label: t('vps.ram'), w: 68, text: '68%' },
    { label: t('vps.disk'), w: 54, text: '54%' },
  ]

  const navCls = (p: Page): string => `nav-item${page === p || (p !== 'overview' && p !== 'apps' && page === p) ? ' active' : ''}`

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo" />
        <span className="sidebar-title">{t('app.brand')}</span>
        <button className="theme-btn" title={t('app.themeToggle')} onClick={toggleTheme}>
          <Icon d={theme === 'dark' ? ICONS.sun : ICONS.moon} size={13} />
          {theme === 'dark' ? t('app.themeDark') : t('app.themeLight')}
        </button>
      </div>
      <nav className="sidebar-nav">
        {MAIN.map((n) => (
          <a key={n.page} href="#" className={navCls(n.page)} onClick={(e) => { e.preventDefault(); setPage(n.page) }}>
            <span className="label">
              <Icon d={ICONS[n.icon]} size={16} />
              {t(n.labelKey)}
            </span>
            <span className="nav-count">{n.page === 'overview' ? '' : APPS.length}</span>
          </a>
        ))}
        {CATS.map((cat) => (
          <Fragment key={cat}>
            <span className="nav-group">{cat}</span>
            {groupItems(cat).map((a) => {
              const st: ServiceStatus = statusFor(a.id, statuses)
              const dot = st === 'online' ? 'var(--green)' : st === 'offline' ? 'var(--red)' : '#7FA8EE'
              return (
                <a key={a.id} href="#" className={navCls(a.id)} onClick={(e) => { e.preventDefault(); setPage(pageOf(a.id)) }}>
                  <span className="label">
                    <Icon d={a.icon} size={15} />
                    <span className="nav-label">{a.name}</span>
                  </span>
                  <span className="nav-count" style={{ color: dot }} title={countOf(a)}>
                    {(connected[a.id] ?? a.on) ? '·' : '×'}
                  </span>
                </a>
              )
            })}
          </Fragment>
        ))}
      </nav>
      <div className="vps-card">
        <div className="vps-head">
          <span className="vps-name">{t('app.vps')}</span>
          <span className="vps-specs">{t('app.vpsSpecs')}</span>
        </div>
        {VPS.map((v) => (
          <div key={v.label} className="vps-row">
            <div className="vps-labels">
              <span>{v.label}</span>
              <span className="val">{v.text}</span>
            </div>
            <div className="vps-track">
              <div className="vps-fill" style={{ width: `${v.w}%` }} />
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
