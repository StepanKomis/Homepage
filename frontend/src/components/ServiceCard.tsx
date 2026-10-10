import React from 'react'
import { useTranslation } from 'react-i18next'
import type { Service } from '../types'
import './ServiceCard.css'

interface ServiceCardProps {
  service: Service
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const { t } = useTranslation()
  const statusKey = `status_${service.status}`
  const lastUpdateTime = new Date(service.lastUpdate)
  const isRecent = Date.now() - lastUpdateTime.getTime() < 60000

  const getIconPath = (icon: string) => {
    const icons: Record<string, string> = {
      'uptime-kuma': '🔔',
      'jellyfin': '🎬',
      'sonarr': '🎥',
      'radarr': '🎞️',
      'bazarr': '📝',
      'audiobookshelf': '📚',
      'honcho': '🧠',
      'mongodb': '🌿',
    }
    return icons[icon] || '⚙️'
  }

  return (
    <a
      href={service.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`service-card service-${service.status} ${isRecent ? 'fresh' : ''}`}
    >
      <div className="service-icon">
        <span className="icon-emoji">{getIconPath(service.icon)}</span>
      </div>
      <h3 className="service-name">{service.name}</h3>
      <p className="service-status">
        <span className={`status-badge status-${service.status}`}></span>
        {t(statusKey)}
      </p>
      <p className="service-timestamp">
        {lastUpdateTime.toLocaleTimeString('cs-CZ', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </p>
      {service.metadata && Object.keys(service.metadata).length > 0 && (
        <div className="service-metadata">
          {Object.entries(service.metadata).slice(0, 2).map(([key, value]) => (
            <div key={key} className="metadata-item">
              <span className="meta-key">{key}</span>
            </div>
          ))}
        </div>
      )}
    </a>
  )
}
