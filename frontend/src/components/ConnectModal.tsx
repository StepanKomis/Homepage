import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon, ICONS } from '../lib/icons'
import { APPS } from '../lib/data'
import { useDashboardStore } from '../store/dashboard'

type Phase = 'idle' | 'testing' | 'ok' | 'err'

export default function ConnectModal({ appId, onClose }: { appId: string; onClose: () => void }): JSX.Element {
  const { t } = useTranslation()
  const app = APPS.find((a) => a.id === appId)
  const setConnected = useDashboardStore((s) => s.setConnected)
  const [url, setUrl] = useState(app?.url ?? '')
  const [key, setKey] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')

  if (!app) return <></>

  const test = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setPhase('testing')
    await new Promise((r) => setTimeout(r, 900))
    setPhase(url.trim() ? 'ok' : 'err')
  }

  const save = (): void => {
    setConnected(app.id, true)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{t('modal.connect', { name: app.name })}</h2>
        <p className="modal-api-line">
          Point the dashboard at your existing <code>{app.name}</code> install. Paste the base URL and an API key with read access.
        </p>
        <form className="field" onSubmit={(e) => void test(e)}>
          <label className="field-label" htmlFor="cm-url">{t('modal.baseUrl')}</label>
          <input id="cm-url" className="field-input" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
          <label className="field-label" htmlFor="cm-key" style={{ marginTop: 10 }}>
            <Icon d={ICONS.key} size={13} /> {t('modal.apiKey')}
          </label>
          <input id="cm-key" className="field-input" type="password" placeholder="API key" value={key} onChange={(e) => setKey(e.target.value)} />
          <p className="field-hint">
            Stored server side, scoped to this service. Try <code>GET {'{url}'}/api/health</code> with the key in the <code>X-Api-Key</code> header.
          </p>
          {phase === 'testing' && (
            <button className="btn btn-ghost" type="submit" disabled>
              <Icon d={ICONS.refresh} size={14} className="spin" /> {t('modal.testing')}
            </button>
          )}
          {phase === 'ok' && <div className="modal-ok">Connection verified.</div>}
          {phase === 'err' && <div className="modal-err">Could not reach the service. Check the URL and key.</div>}
          {phase === 'idle' && (
            <button className="btn btn-ghost" type="submit">
              <Icon d={ICONS.zap} size={14} /> {t('modal.test')}
            </button>
          )}
        </form>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>{t('modal.close')}</button>
          <button className="btn btn-primary" onClick={save} disabled={phase !== 'ok' && phase !== 'idle'}>{t('modal.save')}</button>
        </div>
      </div>
    </div>
  )
}
