import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDashboardStore } from '../store/dashboard'
import { useWebSocket } from '../hooks/useWebSocket'
import ServiceCard from '../components/ServiceCard'
import './Dashboard.css'

export default function Dashboard() {
  const { t } = useTranslation()
  const { services, loading, error } = useDashboardStore()
  useWebSocket()

  if (loading) {
    return <div className="dashboard-loading">{t('loading')}</div>
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>{t('dashboard')}</h1>
        <p>home.komis.cz</p>
      </header>

      {error && <div className="dashboard-error">{error}</div>}

      <div className="services-grid">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </div>
  )
}
