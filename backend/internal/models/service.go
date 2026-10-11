package models

import (
	"time"
)

type ServiceStatus string

const (
	StatusOnline  ServiceStatus = "online"
	StatusOffline ServiceStatus = "offline"
	StatusUnknown ServiceStatus = "unknown"
)

type Service struct {
	ID        string                 `json:"id"`
	Name      string                 `json:"name"`
	Status    ServiceStatus          `json:"status"`
	Icon      string                 `json:"icon"`
	URL       *string                `json:"url,omitempty"`
	LatencyMs int64                  `json:"latencyMs,omitempty"`
	LastUpdate time.Time             `json:"lastUpdate"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

type ServiceHealthCheck struct {
	ServiceID string
	Status    ServiceStatus
	Metadata  map[string]interface{}
	Timestamp time.Time
}

type WSMessage struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}
