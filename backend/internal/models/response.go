package models

type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details map[string]interface{} `json:"details,omitempty"`
}

type StatusResponse struct {
	Services []Service `json:"services"`
	Error    *APIError `json:"error,omitempty"`
}

type ServiceResponse struct {
	Service *Service  `json:"service"`
	Error   *APIError `json:"error,omitempty"`
}

type SuccessResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *APIError   `json:"error,omitempty"`
}

// Error codes
const (
	ErrServiceNotFound = "SERVICE_NOT_FOUND"
	ErrIntegrationFailed = "INTEGRATION_FAILED"
	ErrDatabaseError = "DATABASE_ERROR"
	ErrInvalidRequest = "INVALID_REQUEST"
)
