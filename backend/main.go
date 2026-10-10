package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"homepage/internal/api"
	"homepage/internal/db"
	"homepage/internal/integrations"
	"homepage/internal/models"
	"homepage/internal/websocket"
)

func main() {
	godotenv.Load()

	logger := initLogger()
	defer logger.Sync()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://homepage:homepage@localhost:5432/homepage"
	}

	database, err := db.New(dbURL)
	if err != nil {
		logger.Fatal("failed to connect to database", zap.Error(err))
	}
	defer database.Close()

	config := map[string]string{
		"UPTIME_KUMA_URL":    os.Getenv("UPTIME_KUMA_URL"),
		"JELLYFIN_URL":       os.Getenv("JELLYFIN_URL"),
		"SONARR_URL":         os.Getenv("SONARR_URL"),
		"RADARR_URL":         os.Getenv("RADARR_URL"),
		"BAZARR_URL":         os.Getenv("BAZARR_URL"),
		"AUDIOBOOKSHELF_URL": os.Getenv("AUDIOBOOKSHELF_URL"),
		"HONCHO_URL":         os.Getenv("HONCHO_URL"),
		"MONGO_URL":          os.Getenv("MONGO_URL"),
	}

	im := integrations.NewIntegrationManager(logger, config)
	wsHub := websocket.NewHub(logger)

	go wsHub.Run(context.Background())

	server := api.NewServer(database, im, wsHub, logger)

	host := os.Getenv("BACKEND_HOST")
	if host == "" {
		host = "0.0.0.0"
	}
	port := os.Getenv("BACKEND_PORT")
	if port == "" {
		port = "4200"
	}

	addr := fmt.Sprintf("%s:%s", host, port)
	logger.Info("starting server", zap.String("address", addr))

	httpServer := &http.Server{
		Addr:    addr,
		Handler: server,
	}

	// Health check ticker
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()

		for range ticker.C {
			services := im.CheckAll(context.Background())
			for _, svc := range services {
				database.UpdateServiceStatus(context.Background(), &svc)
				wsHub.BroadcastMessage(&models.WSMessage{
					Type: "status_update",
					Data: svc,
				})
			}
		}
	}()

	// Graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		logger.Info("shutdown signal received")
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		httpServer.Shutdown(ctx)
	}()

	if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Fatal("server error", zap.Error(err))
	}

	logger.Info("server stopped")
}

func initLogger() *zap.Logger {
	config := zap.NewProductionConfig()
	config.Level = zap.NewAtomicLevelAt(zapcore.InfoLevel)
	config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder

	logger, _ := config.Build()
	return logger
}
