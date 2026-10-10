package api

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/gorilla/websocket"
	"go.uber.org/zap"
	"homepage/internal/db"
	"homepage/internal/integrations"
	"homepage/internal/models"
	"homepage/internal/websocket"
)

type Server struct {
	db           *db.Database
	intgr        *integrations.IntegrationManager
	wsHub        *websocket.Hub
	logger       *zap.Logger
	mux          *http.ServeMux
	wsUpgrader   websocket.Upgrader
}

func NewServer(database *db.Database, im *integrations.IntegrationManager, hub *websocket.Hub, logger *zap.Logger) *Server {
	s := &Server{
		db:    database,
		intgr: im,
		wsHub: hub,
		logger: logger,
		mux:   http.NewServeMux(),
		wsUpgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
	}

	s.routes()
	return s
}

func (s *Server) routes() {
	s.mux.HandleFunc("GET /api/v1/status", s.handleGetStatus)
	s.mux.HandleFunc("GET /api/v1/services/{id}", s.handleGetService)
	s.mux.HandleFunc("GET /api/v1/config", s.handleGetConfig)
	s.mux.HandleFunc("POST /api/v1/integration/test", s.handleTestIntegration)
	s.mux.HandleFunc("GET /api/ws", s.handleWebSocket)
	s.mux.HandleFunc("GET /health", s.handleHealth)
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.mux.ServeHTTP(w, r)
}

func (s *Server) handleGetStatus(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 15e9)
	defer cancel()

	services, err := s.db.GetAllServices(ctx)
	if err != nil || len(services) == 0 {
		s.logger.Warn("fetching from db failed, checking integrations", zap.Error(err))
		services = s.intgr.CheckAll(ctx)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"services": services,
	})
}

func (s *Server) handleGetService(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	ctx, cancel := context.WithTimeout(r.Context(), 5e9)
	defer cancel()

	services, err := s.db.GetAllServices(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch services", http.StatusInternalServerError)
		return
	}

	for _, svc := range services {
		if svc.ID == id {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"service": svc,
			})
			return
		}
	}

	http.Error(w, "Service not found", http.StatusNotFound)
}

func (s *Server) handleGetConfig(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"timezone": "Europe/Prague",
		"version":  "0.1.0",
	})
}

func (s *Server) handleTestIntegration(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ServiceID string `json:"service_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10e9)
	defer cancel()

	var svc *models.Service
	var err error

	switch req.ServiceID {
	case "uptime-kuma":
		svc, err = s.intgr.CheckUptimeKuma(ctx)
	case "jellyfin":
		svc, err = s.intgr.CheckJellyfin(ctx)
	case "sonarr":
		svc, err = s.intgr.CheckSonarr(ctx)
	case "radarr":
		svc, err = s.intgr.CheckRadarr(ctx)
	case "bazarr":
		svc, err = s.intgr.CheckBazarr(ctx)
	case "audiobookshelf":
		svc, err = s.intgr.CheckAudiobookshelf(ctx)
	default:
		http.Error(w, "Unknown service", http.StatusBadRequest)
		return
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if svc != nil {
		s.db.UpdateServiceStatus(ctx, svc)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"service": svc,
	})
}

func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := s.wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		s.logger.Error("websocket upgrade failed", zap.Error(err))
		return
	}

	s.wsHub.NewClient(conn)
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "ok",
	})
}
