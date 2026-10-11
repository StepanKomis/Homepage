import { useTranslation } from 'react-i18next'
import { Icon } from '../lib/icons'
import { APPS } from '../lib/data'
import { useDashboardStore } from '../store/dashboard'
import { statusFor, latencyFor } from '../hooks/useBackend'

export default function ServicesList({ onOpen }: { onOpen: (id: string) => void }): JSX.Element {
  const { t } = useTranslation()
  const query = useDashboardStore((s) => s.query)
  const setQuery = useDashboardStore((s) => s.setQuery)
  const statuses = useDashboardStore((s) => s.statuses)
  const connected = useDashboardStore((s) => s.connected)

  const q = query.trim().toLowerCase()
  const urls = useDashboardStore((s) => s.urls)
  const list = APPS.filter((a) => {
    if (!q) return true
    const u = urls[a.id] ?? a.url
    return a.name.toLowerCase().includes(q) || u.toLowerCase().includes(q)
  })

  return (
    <section className="card" style={{ gap: 0 }}>
      <div className="card-h">
        <h2>{t('overview.services')}</h2>
        <span className="card-link" style={{ fontWeight: 400, color: 'var(--subtle)' }}>
          {connectedCount(connected, statuses)} / {APPS.length}
        </span>
      </div>
      <input
        className="field-input"
        placeholder={t('overview.filterPlaceholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: 8 }}
      />
      <div className="svc-grid">
        {list.map((a) => {
          const st = statusFor(a.id, statuses)
          const on = connected[a.id] ?? a.on
          const lat = latencyFor(a.id)
          const dot = st === 'online' ? 'var(--green)' : st === 'offline' ? 'var(--red)' : 'var(--subtle)'
          const healthColor = st === 'online' ? 'var(--green)' : st === 'offline' ? 'var(--red)' : 'var(--muted)'
          const health = st === 'online' ? t('services.status_online') : st === 'offline' ? t('services.status_offline') : t('services.status_unknown')
          return (
            <a
              key={a.id}
              href={on ? urls[a.id] ?? undefined : undefined}
              className="svc-row"
              onClick={(e) => {
                if (!on) {
                  e.preventDefault()
                  onOpen(a.id)
                }
              }}
            >
              <span className="icon-box svc-icon" style={{ background: a.tint }}>
                <Icon d={a.icon} size={15} color={a.hue} />
                <span className="svc-dot" style={{ background: dot }} />
              </span>
              <span className="svc-name-col">
                <span className="svc-name">{a.name}</span>
                <span className="svc-url">{(urls[a.id] ?? a.url).replace(/^https?:\/\//, '')}</span>
              </span>
              <span className="svc-health" style={{ color: healthColor }}>{health}</span>
              <span className="svc-lat">{lat !== null ? `${lat} ms` : ''}</span>
            </a>
          )
        })}
      </div>
      {list.length === 0 && <p className="empty">{t('overview.noServices', { query })}</p>}
    </section>
  )
}

function connectedCount(connected: Record<string, boolean>, statuses: Record<string, string>): number {
  return APPS.filter((a) => (connected[a.id] ?? false) && statuses[a.id] !== 'offline').length
}
