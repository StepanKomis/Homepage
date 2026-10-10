import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDashboardStore } from '../store/dashboard'
import { useWebSocket } from '../hooks/useWebSocket'
import ServiceCard from '../components/ServiceCard'
import { apiService } from '../services/api'
import './Dashboard.css'

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const { services, loading, error, setServices, setLoading, setError } = useDashboardStore()
  useWebSocket()

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true)
        const loadedServices = await apiService.getAllServices()
        setServices(loadedServices)
        setError(null)
      } catch (err) {
        console.error('Failed to load services:', err)
        setError(t('error'))
      } finally {
        setLoading(false)
      }
    }

    loadServices()
  }, [setServices, setLoading, setError, t])

  const onlineCount = services.filter(s => s.status === 'online').length
  const totalCount = services.length

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>{t('dashboard')}</h1>
          <p className="header-domain">home.komis.cz</p>
        </div>
        <div className="header-stats">
          <span className="stat online">
            {onlineCount}/{totalCount} {t('status_online').toLowerCase()}
          </span>
          <button className="lang-toggle" onClick={() => i18n.changeLanguage(i18n.language === 'cs' ? 'en' : 'cs')}>
            {i18n.language.toUpperCase()}
          </button>
        </div>
      </header>

      {error && (
        <div className="dashboard-error">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>{t('loading')}</p>
        </div>
      ) : (
        <>
          {services.length === 0 ? (
            <div className="dashboard-empty">
              <p>{t('no_services')}</p>
            </div>
          ) : (
            <div className="services-grid">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </>
      )}

      <footer className="dashboard-footer">
        <p>
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </footer>
    </div>
  )
}
