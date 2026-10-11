/* Icons: lucide-style SVG path data, copied verbatim from homepage-design/app-logic.js */
export const ICONS: Record<string, string> = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z', layers: 'M12 2 2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
  film: 'M3 3h18v18H3z M7 3v18 M17 3v18 M3 7.5h4 M3 12h18 M3 16.5h4 M17 7.5h4 M17 16.5h4', inbox: 'M22 12h-6l-2 3h-4l-2-3H2 M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
  image: 'M3 3h18v18H3z M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M21 15l-5-5L5 21', headphones: 'M3 18v-6a9 9 0 0 1 18 0v6 M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z',
  music: 'M9 18V5l12-2v13 M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', tv: 'M2 7h20v13H2z M17 2l-5 5-5-5',
  clapper: 'M4 11v9h16v-9z M4 11l-.8-4 15.6-3.4.9 4z M7.5 6.3l2.6 3.4 M12.6 5.2l2.6 3.4', search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3', workflow: 'M3 3h6v6H3z M15 15h6v6h-6z M6 9v3a3 3 0 0 0 3 3h6',
  box: 'M21 8 12 3 3 8v8l9 5 9-5z M3 8l9 5 9-5 M12 13v8', network: 'M12 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M5 23a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M19 23a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M12 5v6 M12 11l-6 8 M12 11l6 8',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M2 12h20 M12 2a15 15 0 0 1 0 20 M12 2a15 15 0 0 0 0 20', activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  chart: 'M3 3v18h18 M7 15l4-4 3 3 5-6', shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4', cloud: 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z',
  utensils: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2 M7 2v20 M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z M21 15v7', pin: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a1.94 1.94 0 0 0 3.4 0', refresh: 'M3 12a9 9 0 0 1 15-6.7L21 8 M21 3v5h-5 M21 12a9 9 0 0 1-15 6.7L3 16 M3 21v-5h5',
  play: 'M6 3l14 9-14 9z', pause: 'M6 4h4v16H6z M14 4h4v16h-4z', stop: 'M5 5h14v14H5z', trash: 'M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  zap: 'M13 2 3 14h9l-1 8 10-12h-9z', external: 'M15 3h6v6 M10 14 21 3 M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6', plus: 'M12 5v14 M5 12h14',
  message: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', check: 'M20 6 9 17l-5-5', x: 'M18 6 6 18 M6 6l12 12', power: 'M12 2v10 M18.4 6.6a9 9 0 1 1-12.8 0',
  key: 'M15.5 7.5l3 3L22 7l-3-3 M21 2l-9.6 9.6 M7.5 22a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z', users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  calendar: 'M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18', book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
  server: 'M2 2h20v8H2z M2 14h20v8H2z M6 6h.01 M6 18h.01', clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2', arrow: 'M5 12h14 M12 5l7 7-7 7', arrowRight: 'M5 12h14 M12 5l7 7-7 7', database: 'M12 2c5 0 9 1.3 9 3v14c0 1.7-4 3-9 3s-9-1.3-9-3V5c0-1.7 4-3 9-3z M21 5c0 1.7-4 3-9 3S3 6.7 3 5 M21 12c0 1.7-4 3-9 3s-9-1.3-9-3',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M12 1v2 M12 21v2 M4.2 4.2l1.4 1.4 M18.4 18.4l1.4 1.4 M1 12h2 M21 12h2 M4.2 19.8l1.4-1.4 M18.4 5.6l1.4-1.4', moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
}

export const ICON_RULES: [RegExp, string][] = [[/^(Scan|Refresh|Sync|Renew|Restart|Redeploy|Update gravity|Run cron)/, 'refresh'], [/^(Run|Start|Resume|Activate|Unsilence)/, 'play'], [/^Pause/, 'pause'], [/^Stop/, 'stop'], [/^(Delete|Revoke|Prune)/, 'trash'], [/^Test/, 'zap'], [/^Open/, 'external'], [/^(Add|New|Generate)/, 'plus'], [/^Search/, 'search'], [/^(Approve|Confirm|Check|Enable)/, 'check'], [/^(Decline|Uncheck)/, 'x'], [/^(Disable|Deactivate)/, 'power'], [/^Silence/, 'bell'], [/^Expire/, 'key'], [/^Update/, 'download']]

export const iconFor = (label: string): string =>
  ICONS[(ICON_RULES.find(([r]) => r.test(label)) || [0, 'arrow'])[1]]

export function Icon({ d, size = 16, color, className, style }: { d: string; size?: number; color?: string; className?: string; style?: React.CSSProperties }) {
  if (!d) return null
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }} className={className}>
      {d.split(' M').map((seg, i) => (
        <path key={i} d={i === 0 ? seg : 'M' + seg} />
      ))}
    </svg>
  )
}
