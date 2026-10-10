package db

import (
	"context"
	"database/sql"
	"fmt"
	"sync"
	"time"

	_ "github.com/lib/pq"
	"homepage/internal/models"
)

type Database struct {
	conn *sql.DB
	mu   sync.RWMutex
}

func New(connStr string) (*Database, error) {
	conn, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := conn.Ping(); err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	conn.SetMaxOpenConns(25)
	conn.SetMaxIdleConns(5)
	conn.SetConnMaxLifetime(5 * time.Minute)

	db := &Database{conn: conn}
	if err := db.migrate(); err != nil {
		return nil, fmt.Errorf("migration failed: %w", err)
	}

	return db, nil
}

func (db *Database) migrate() error {
	schema := `
	CREATE TABLE IF NOT EXISTS services (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		status TEXT NOT NULL,
		icon TEXT NOT NULL,
		url TEXT,
		last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS health_checks (
		id SERIAL PRIMARY KEY,
		service_id TEXT REFERENCES services(id),
		status TEXT NOT NULL,
		metadata JSONB,
		timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_health_checks_service_id ON health_checks(service_id);
	CREATE INDEX IF NOT EXISTS idx_health_checks_timestamp ON health_checks(timestamp DESC);
	`

	_, err := db.conn.Exec(schema)
	return err
}

func (db *Database) GetAllServices(ctx context.Context) ([]models.Service, error) {
	db.mu.RLock()
	defer db.mu.RUnlock()

	rows, err := db.conn.QueryContext(ctx, "SELECT id, name, status, icon, url, last_update FROM services ORDER BY name")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var services []models.Service
	for rows.Next() {
		var s models.Service
		if err := rows.Scan(&s.ID, &s.Name, &s.Status, &s.Icon, &s.URL, &s.LastUpdate); err != nil {
			return nil, err
		}
		services = append(services, s)
	}

	return services, rows.Err()
}

func (db *Database) UpdateServiceStatus(ctx context.Context, svc *models.Service) error {
	db.mu.Lock()
	defer db.mu.Unlock()

	_, err := db.conn.ExecContext(ctx,
		"INSERT INTO services (id, name, status, icon, url) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET status = $3, last_update = CURRENT_TIMESTAMP",
		svc.ID, svc.Name, svc.Status, svc.Icon, svc.URL,
	)
	return err
}

func (db *Database) Close() error {
	return db.conn.Close()
}
