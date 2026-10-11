import { useTranslation } from 'react-i18next'
import { Icon } from '../lib/icons'
import { APPS, CATS } from '../lib/data'
import { realUrl } from '../hooks/useBackend'
import { useDashboardStore } from '../store/dashboard'
import { statusFor, latencyFor } from '../hooks/useBackend'

export default function OverviewWall({ onOpen }: { onOpen: (id: string) => void }): JSX.Element {
  const { t } = useTranslation()
  const statuses = useDashboardStore((s) => s.statuses)
  const connected = useDashboardStore((s) => s.connected)

  return (
    <>
      {CATS.map((cat) => (
        <section key={cat} className="wall-section">
          <h3 className="wall-title">{cat}</h3>
          <div className="wall-grid">
            {APPS.filter((a) => a.cat === cat).map((a) => {
              const st = statusFor(a.id, statuses)
              const on = connected[a.id] ?? a.on
              const lat = latencyFor(a.id)
              const dot = st === 'online' ? 'var(--green)' : st === 'offline' ? 'var(--red)' : 'var(--subtle)'
              const health = st === 'online' ? t('services.status_online') : st === 'offline' ? t('services.status_offline') : t('services.status_unknown')
              return (
                <a
                  key={a.id}
                  href={on ? realUrl(a.id) ?? undefined : undefined}
                  className={`wall-tile${on ? '' : ' disconnected'}`}
                  onClick={(e) => {
                    if (!on) {
                      e.preventDefault()
                      onOpen(a.id)
                    }
                  }}
                >
                  <span className="wall-tile-top">
                    <span className="icon-box wall-tile-icon" style={{ background: a.tint }}>
                      <Icon d={a.icon} size={17} color={a.hue} />
                      <span className="svc-dot" style={{ background: dot }} />
                    </span>
                    <span className="wall-tile-name">{a.name}</span>
                  </span>
                  <span className="wall-tile-stat" style={{ color: st === 'online' ? 'var(--green)' : st === 'offline' ? 'var(--red)' : 'var(--muted)' }}>
                    {health}
                  </span>
                  <span className="wall-tile-api">{(realUrl(a.id) ?? a.url).replace(/^https?:\/\//, '')}</span>
                  {lat !== null && (
                    <span className="svc-lat" style={{ textAlign: 'left' }}>{lat} ms</span>
                  )}
                </a>
              )
            })}
          </div>
        </section>
      ))}
    </>
  )
}
