import { useTranslation } from 'react-i18next'
import { Icon, ICONS } from '../lib/icons'
import { STREAMS, TORRENTS, UPCOMING, ALERTS, type Stream, type TorrentState, ST } from '../lib/data'
import { useDashboardStore } from '../store/dashboard'

const pct = (s: Stream): number => Math.round(s.pos * 100)

function EqBars(): JSX.Element {
  return (
    <span className="eq" aria-hidden="true">
      <span />
      <span style={{ animationDelay: '150ms' }} />
      <span style={{ animationDelay: '300ms' }} />
    </span>
  )
}

const alertTone = (prio: number): string => (prio >= 8 ? 'var(--red)' : prio >= 5 ? 'var(--amber)' : 'var(--blueInk)')

export default function OverviewPipeline(): JSX.Element {
  const { t } = useTranslation()
  const media = useDashboardStore((s) => s.media)

  const streams: Stream[] = media.streams.length ? media.streams : STREAMS
  const torrents = media.torrents.length ? media.torrents : TORRENTS
  const upcoming = media.upcoming.length ? media.upcoming : UPCOMING
  const alerts = media.alerts.length ? media.alerts : ALERTS
  const downloads = torrents.filter((x) => x.st === 'downloading').length
  const seeding = torrents.filter((x) => x.st === 'seeding').length

  const STEPS = [
    { label: 'Request', value: '2', sub: 'seerr queue', href: '#' },
    { label: 'Search', value: '6', sub: 'prowlarr hits', href: '#' },
    { label: 'Download', value: String(downloads), sub: 'qbit active', href: '#' },
    { label: 'Organize', value: String(seeding), sub: 'moved + renamed', href: '#' },
  ]

  return (
    <>
      <section className="pipeline">
        {STEPS.map((s) => (
          <a key={s.label} className="pipe-card" href={s.href}>
            <span className="pipe-step"><Icon d={ICONS.arrowRight} size={13} /> {s.label}</span>
            <span className="pipe-value">{s.value}</span>
            <span className="pipe-sub">{s.sub}</span>
            <span className="pipe-flow" />
          </a>
        ))}
      </section>

      <section className="pipe-grid2">
        <div className="card">
          <div className="card-h">
            <h2><Icon d={ICONS.film} size={17} /> {t('overview.watching')}</h2>
            <a className="card-link" href="#">{t('overview.nowPlaying')} →</a>
          </div>
          {streams.length === 0 ? (
            <p className="empty">{t('overview.emptyStreams')}</p>
          ) : (
            <div className="watch-grid">
              {streams.map((s) => (
                <div key={s.id} className="watch-card">
                  <span className="watch-user">{s.user} · {s.client} {s.mode !== 'Direct play' && <EqBars />}</span>
                  <span className="watch-title">{s.title}</span>
                  <span className="stream-sub">{s.sub} · {s.mode}</span>
                  <div className="track">
                    <div className="fill-blue" style={{ width: `${pct(s)}%` }} />
                  </div>
                  <span className="stream-meta"><span>{pct(s)}%</span><span>{s.mode}</span></span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-h">
            <h2><Icon d={ICONS.tv} size={17} /> {t('overview.arriving')}</h2>
            <a className="card-link" href="#">Sonarr · Radarr →</a>
          </div>
          {upcoming.slice(0, 4).map((u, i) => (
            <div key={i} className="upcoming-row">
              <span className="upcoming-day">{u.day}<br /><span className="upcoming-time">{u.time}</span></span>
              <span className="upcoming-title">{u.title}<span className="upcoming-ep">{u.ep}</span></span>
              <span className="pill">{u.src}</span>
            </div>
          ))}
          <div className="card-h" style={{ marginTop: 12 }}>
            <h2><Icon d={ICONS.bell} size={17} /> {t('overview.alerts')}</h2>
          </div>
          {alerts.map((a, i) => (
            <div key={i} className="pipe-alert-row">
              <span className="alert-dot pipe-alert-dot" style={{ background: alertTone(a.prio) }} />
              <span className="alert-text">
                <strong>{a.app}</strong> · {a.title}{' '}
                <span style={{ color: 'var(--muted)' }}>{a.msg}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
