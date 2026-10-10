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

  return (
    <a
      href={service.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`service-card service-${service.status}`}
    >
      <div className="service-icon">
        <img src={`/icons/${service.icon}.svg`} alt={service.name} />
      </div>
      <h3>{service.name}</h3>
      <p className="service-status">{t(statusKey)}</p>
      <p className="service-timestamp">
        {new Date(service.lastUpdate).toLocaleTimeString()}
      </p>
    </a>
  )
}
