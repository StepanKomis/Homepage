package integrations

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.uber.org/zap"
	"homepage/internal/models"
)

// Honcho integration
func (im *IntegrationManager) CheckHoncho(ctx context.Context) (*models.Service, error) {
	url := im.config["HONCHO_URL"]
	if url == "" {
		return nil, fmt.Errorf("HONCHO_URL not configured")
	}

	req, _ := http.NewRequestWithContext(ctx, "GET", url+"/health", nil)
	resp, err := im.client.Do(req)
	if err != nil {
		return &models.Service{
			ID:         "honcho",
			Name:       "Honcho Memory",
			Status:     models.StatusOffline,
			Icon:       "honcho",
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
		ID:        "honcho",
		Name:      "Honcho Memory",
		Status:    status,
		Icon:      "honcho",
		URL:       stringPtr(url),
		LastUpdate: time.Now(),
		Metadata:  metadata,
	}, nil
}

// MongoDB (mongo2) integration
type MongoIntegration struct {
	client *mongo.Client
	logger *zap.Logger
}

func NewMongoIntegration(logger *zap.Logger, url string) (*MongoIntegration, error) {
	opts := options.Client().ApplyURI(url)
	client, err := mongo.Connect(context.Background(), opts)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	return &MongoIntegration{
		client: client,
		logger: logger,
	}, nil
}

func (m *MongoIntegration) Check(ctx context.Context) (*models.Service, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	err := m.client.Ping(ctx, nil)
	status := models.StatusOnline
	if err != nil {
		status = models.StatusOffline
		m.logger.Error("mongo ping failed", zap.Error(err))
	}

	// Get database stats
	var metadata map[string]interface{}
	admin := m.client.Database("admin")
	result := admin.RunCommand(ctx, bson.M{"dbStats": 1})
	result.Decode(&metadata)

	return &models.Service{
		ID:         "mongo2",
		Name:       "MongoDB",
		Status:     status,
		Icon:       "mongodb",
		URL:        stringPtr("mongodb://mongo2:27017"),
		LastUpdate: time.Now(),
		Metadata:   metadata,
	}, nil
}

func (m *MongoIntegration) Close() error {
	return m.client.Disconnect(context.Background())
}
