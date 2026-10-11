import { useTranslation } from 'react-i18next'
import { Icon, ICONS } from '../lib/icons'
import { STREAMS, TORRENTS, UPCOMING, ALERTS, LIBRARY, ST, type Stream, type Torrent, type UpcomingItem, type AlertItem, type TorrentState } from '../lib/data'
import { useDashboardStore } from '../store/dashboard'
import type { LibraryStat } from '../lib/integrations'

const pct = (s: Stream): number => Math.round(s.pos * 100)

const fmtSize = (gb: number): string => `${gb.toFixed(1)} GB`
const fmtSpeed = (mb: number): string => `${mb.toFixed(1)} MB/s`

function EqBars(): JSX.Element {
  return (
    <span className="eq" aria-hidden="true">
      <span style={{ animationDelay: '0ms' }} />
      <span style={{ animationDelay: '150ms' }} />
      <span style={{ animationDelay: '300ms' }} />
    </span>
  )
}

function Kpi({ label, value, sub, icon, tint, href, spark, delay }: {
  label: string
  value: string | number
  sub?: string
  icon: string
  tint: string
  href?: string
  spark?: number[]
  delay: number
}): JSX.Element {
  const pts = spark
  const w = 220
  const h = 26
  const path = pts && pts.length > 1
    ? 'M' + pts.map((v, i) => `${(i / (pts.length - 1)) * w},${h - (v / 100) * (h - 3) - 1.5}`).join(' L')
    : undefined
  const inner = (
    <>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <span className="kpi-icon" style={{ background: tint }}>
          <Icon d={ICONS[icon]} size={15} />
        </span>
      </div>
      <span className="kpi-value">{value}</span>
      {sub && <span className="kpi-sub">{sub}</span>}
      {path && (
        <svg className="kpi-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
          <path d={path} fill="none" stroke="var(--blueInk)" strokeOpacity=".45" strokeWidth="1.5" />
        </svg>
      )}
    </>
  )
  return href ? (
    <a className="kpi" href={href} style={{ animationDelay: `${delay}ms` }}>{inner}</a>
  ) : (
    <div className="kpi" style={{ animationDelay: `${delay}ms` }}>{inner}</div>
  )
}

const alertTone = (prio: number): string => (prio >= 8 ? 'var(--red)' : prio >= 5 ? 'var(--amber)' : 'var(--blueInk)')

export default function OverviewGrid(): JSX.Element {
  const { t } = useTranslation()
  const media = useDashboardStore((s) => s.media)
  const libraryLive = useDashboardStore((s) => s.library)
  const connected = useDashboardStore((s) => s.connected)

  const streams: Stream[] = media.streams.length ? media.streams : STREAMS
  const torrents: Torrent[] = media.torrents.length ? media.torrents : TORRENTS
  const upcoming: UpcomingItem[] = media.upcoming.length ? media.upcoming : UPCOMING
  const alerts: AlertItem[] = media.alerts.length ? media.alerts : ALERTS
  const LIB: { value: string | number; label: string; src: string }[] =
    libraryLive && libraryLive.length
      ? libraryLive.map((l: LibraryStat) => ({ value: l.value, label: l.label, src: 'Live' }))
      : LIBRARY
  const jelly = connected.jellyfin !== false

  const streamsLive = streams.length
  const active = torrents.filter((x) => x.st === 'downloading').length

  return (
    <>
      <section className="kpi-grid">
        <Kpi label={t('nav.apps')} value={jelly ? '20' : '19'} sub="18/20" icon="activity" tint="var(--greenTint)" delay={40} />
        <Kpi label={t('overview.nowPlaying')} value={String(streamsLive)} sub={`${streamsLive} ${t('overview.streamsSuffix')}`} icon="film" tint="var(--blueTint)" spark={[40, 55, 45, 70, 60, 85]} delay={80} />
        <Kpi label={t('overview.queue')} value={String(active)} sub={`${active} active · 96% up`} icon="download" tint="var(--greenTint)" spark={[90, 88, 92, 96, 94, 96]} delay={120} />
        <Kpi label={t('overview.alerts')} value={String(alerts.length)} sub={`${alerts.filter((a) => a.prio >= 5).length} need attention`} icon="bell" tint="var(--amberTint)" delay={160} />
      </section>

      <section className="grid2">
        <div className="card">
          <div className="card-h">
            <h2><Icon d={ICONS.film} size={17} /> {t('overview.nowPlaying')}</h2>
            <a className="card-link" href="#">{t('overview.nowPlaying')} →</a>
          </div>
          {streams.length === 0 ? (
            <p className="empty">{t('overview.emptyStreams')}</p>
          ) : (
            streams.map((s) => (
              <div key={s.id} className="stream-row">
                <div className="stream-head">
                  <div className="stream-title-col">
                    <span className="stream-title">{s.title}{s.mode === 'Direct play' ? '' : <EqBars />}</span>
                    <span className="stream-sub">{s.sub}</span>
                  </div>
                  <span className="stream-user">
                    {s.user} · {s.client}
                    <br />
                    <span style={{ color: 'var(--blueInk)' }}>{s.mode}</span>
                  </span>
                </div>
                <div className="track">
                  <div className="fill-blue" style={{ width: `${pct(s)}%` }} />
                </div>
                <div className="stream-meta">
                  <span>{pct(s)}%</span>
                  <span>{s.client}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-h">
            <h2><Icon d={ICONS.download} size={17} /> {t('overview.queue')}</h2>
            <a className="card-link" href="#">{t('overview.queue')} →</a>
          </div>
          {torrents.map((x) => {
            const [label, color] = ST[x.st]
            const p = Math.round(x.prog * 100)
            const style: React.CSSProperties =
              x.st === 'downloading'
                ? { background: 'linear-gradient(90deg,#1F5FD1,#5B8FF0)', boxShadow: '0 0 10px rgba(47,111,228,.55)' }
                : x.st === 'seeding'
                  ? { background: 'var(--green)' }
                  : x.st === 'stalled'
                    ? { background: 'var(--amber)' }
                    : { background: 'var(--subtle)' }
            return (
              <div key={x.id} className="torrent-row">
                <div className="torrent-head">
                  <span className="torrent-name">{x.name}</span>
                  <span className="torrent-status" style={{ color }}>{label}</span>
                </div>
                <div className="track">
                  <div className="torrent-fill" style={{ width: `${p}%`, ...style }} />
                </div>
                <div className="torrent-meta">
                  <span>{p}% of {fmtSize(x.size)}</span>
                  {x.st === 'downloading' ? <span>{fmtSpeed(x.dl)} ↓ · {fmtSpeed(x.ul)} ↑</span> : <span>{x.cat}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="grid2">
        <div className="card">
          <div className="card-h">
            <h2><Icon d={ICONS.tv} size={17} /> {t('overview.upcoming')}</h2>
            <a className="card-link" href="#">Sonarr · Radarr →</a>
          </div>
          {upcoming.map((u, i) => (
            <div key={i} className="upcoming-row">
              <span className="upcoming-day">
                {u.day}
                <br />
                <span className="upcoming-time">{u.time}</span>
              </span>
              <span className="upcoming-title">
                {u.title}
                <span className="upcoming-ep">{u.ep}</span>
              </span>
              <span className="pill">{u.src}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-h">
            <h2><Icon d={ICONS.database} size={17} /> {t('overview.library')}</h2>
          </div>
          <div className="lib-grid">
            {LIB.map((l) => (
              <div key={l.label}>
                <span className="lib-value">{l.value}</span>
                <br />
                <span className="lib-label">{l.label}</span>
                <br />
                <span className="lib-src">{l.src}</span>
              </div>
            ))}
          </div>
          <div className="card-h" style={{ marginTop: 12 }}>
            <h2><Icon d={ICONS.bell} size={17} /> {t('overview.alerts')}</h2>
          </div>
          {alerts.map((a, i) => (
            <div key={i} className="alert-row">
              <span className="alert-dot" style={{ background: alertTone(a.prio) }} />
              <span className="alert-text">
                <strong>{a.app}</strong> · {a.title}{' '}
                <span style={{ color: 'var(--muted)' }}>{a.msg}</span>
              </span>
              <span className="alert-when">{a.t}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
