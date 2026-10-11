package integrations

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"go.uber.org/zap"
	"homepage/internal/models"
)

type IntegrationManager struct {
	client  *http.Client
	logger  *zap.Logger
	config  map[string]string
	timeout time.Duration
}

func NewIntegrationManager(logger *zap.Logger, config map[string]string) *IntegrationManager {
	return &IntegrationManager{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
		logger:  logger,
		config:  config,
		timeout: 10 * time.Second,
	}
}

// UptimeKuma
func (im *IntegrationManager) CheckUptimeKuma(ctx context.Context) (*models.Service, error) {
	url := im.config["UPTIME_KUMA_URL"]
	if url == "" {
		return nil, fmt.Errorf("UPTIME_KUMA_URL not configured")
	}

	req, _ := http.NewRequestWithContext(ctx, "GET", url+"/api/status", nil)
	resp, err := im.client.Do(req)
	if err != nil {
		return &models.Service{
			ID:        "uptime-kuma",
			Name:      "Uptime Kuma",
			Status:    models.StatusOffline,
			Icon:      "uptime-kuma",
			LastUpdate: time.Now(),
		}, nil
	}
	defer resp.Body.Close()

	status := models.StatusOnline
	if resp.StatusCode != http.StatusOK {
		status = models.StatusUnknown
	}

	return &models.Service{
		ID:         "uptime-kuma",
		Name:       "Uptime Kuma",
		Status:     status,
		Icon:       "uptime-kuma",
		URL:        stringPtr(url),
		LastUpdate: time.Now(),
	}, nil
}

// Jellyfin
func (im *IntegrationManager) CheckJellyfin(ctx context.Context) (*models.Service, error) {
	url := im.config["JELLYFIN_URL"]
	if url == "" {
		return nil, fmt.Errorf("JELLYFIN_URL not configured")
	}

	req, _ := http.NewRequestWithContext(ctx, "GET", url+"/health", nil)
	resp, err := im.client.Do(req)
	if err != nil {
		return &models.Service{
			ID:         "jellyfin",
			Name:       "Jellyfin",
			Status:     models.StatusOffline,
			Icon:       "jellyfin",
			LastUpdate: time.Now(),
		}, nil
	}
	defer resp.Body.Close()

	status := models.StatusOnline
	if resp.StatusCode != http.StatusOK && resp.StatusCode != 200 {
		status = models.StatusUnknown
	}

	return &models.Service{
		ID:         "jellyfin",
		Name:       "Jellyfin",
		Status:     status,
		Icon:       "jellyfin",
		URL:        stringPtr(url),
		LastUpdate: time.Now(),
	}, nil
}

// Sonarr
func (im *IntegrationManager) CheckSonarr(ctx context.Context) (*models.Service, error) {
	return im.checkArrrService(ctx, "sonarr", "Sonarr", im.config["SONARR_URL"])
}

// Radarr
func (im *IntegrationManager) CheckRadarr(ctx context.Context) (*models.Service, error) {
	return im.checkArrrService(ctx, "radarr", "Radarr", im.config["RADARR_URL"])
}

// Bazarr
func (im *IntegrationManager) CheckBazarr(ctx context.Context) (*models.Service, error) {
	return im.checkArrrService(ctx, "bazarr", "Bazarr", im.config["BAZARR_URL"])
}

func (im *IntegrationManager) checkArrrService(ctx context.Context, id, name, url string) (*models.Service, error) {
	if url == "" {
		return nil, fmt.Errorf("%s URL not configured", name)
	}

	apiPath := "/api/v1/system/status"
	if id == "sonarr" || id == "radarr" {
		apiPath = "/api/v3/system/status"
	}
	req, _ := http.NewRequestWithContext(ctx, "GET", url+apiPath, nil)
	if key := im.config[strings.ToUpper(id)+"_API_KEY"]; key != "" {
		req.Header.Set("X-Api-Key", key)
	}
	resp, err := im.client.Do(req)
	if err != nil {
		return &models.Service{
			ID:         id,
			Name:       name,
			Status:     models.StatusOffline,
			Icon:       id,
			LastUpdate: time.Now(),
		}, nil
	}
	defer resp.Body.Close()

	status := models.StatusOnline
	if resp.StatusCode != http.StatusOK {
		status = models.StatusUnknown
	}

	var metadata map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &metadata)

	return &models.Service{
		ID:        id,
		Name:      name,
		Status:    status,
		Icon:      id,
		URL:       stringPtr(url),
		LastUpdate: time.Now(),
		Metadata:  metadata,
	}, nil
}

// Audiobookshelf
func (im *IntegrationManager) CheckAudiobookshelf(ctx context.Context) (*models.Service, error) {
	url := im.config["AUDIOBOOKSHELF_URL"]
	if url == "" {
		return nil, fmt.Errorf("AUDIOBOOKSHELF_URL not configured")
	}

	req, _ := http.NewRequestWithContext(ctx, "GET", url+"/ping", nil)
	resp, err := im.client.Do(req)
	if err != nil {
		return &models.Service{
			ID:         "audiobookshelf",
			Name:       "Audiobookshelf",
			Status:     models.StatusOffline,
			Icon:       "audiobookshelf",
			LastUpdate: time.Now(),
		}, nil
	}
	defer resp.Body.Close()

	status := models.StatusOnline
	if resp.StatusCode != http.StatusOK {
		status = models.StatusUnknown
	}

	return &models.Service{
		ID:         "audiobookshelf",
		Name:       "Audiobookshelf",
		Status:     status,
		Icon:       "audiobookshelf",
		URL:        stringPtr(url),
		LastUpdate: time.Now(),
	}, nil
}

// Helper
func stringPtr(s string) *string {
	return &s
}

// CheckAll runs all health checks concurrently
func (im *IntegrationManager) CheckAll(ctx context.Context) []models.Service {
	checks := []struct {
		name  string
		fn    func(context.Context) (*models.Service, error)
	}{
		{"UptimeKuma", im.CheckUptimeKuma},
		{"Jellyfin", im.CheckJellyfin},
		{"Sonarr", im.CheckSonarr},
		{"Radarr", im.CheckRadarr},
		{"Bazarr", im.CheckBazarr},
		{"Audiobookshelf", im.CheckAudiobookshelf},
	}

	results := make(chan models.Service, len(checks))
	for _, check := range checks {
		go func(c struct {
			name string
			fn   func(context.Context) (*models.Service, error)
		}) {
			svc, err := c.fn(ctx)
			if err != nil {
				im.logger.Error("health check failed", zap.String("service", c.name), zap.Error(err))
				return
			}
			if svc != nil {
				results <- *svc
			}
		}(check)
	}

	var services []models.Service
	for i := 0; i < len(checks); i++ {
		select {
		case svc := <-results:
			services = append(services, svc)
		case <-time.After(15 * time.Second):
			im.logger.Warn("health check timeout")
		}
	}

	return services
}
