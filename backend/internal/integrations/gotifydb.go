
package integrations

// GetGotifyMessagesDB reads recent messages directly from the Gotify PostgreSQL DB.
// Used because app tokens cannot read messages via the HTTP API.
import (
	"context"
	"database/sql"
	"fmt"
	_ "github.com/lib/pq"
)

type GotifyDB struct{ dsn string }

func NewGotifyDB(dsn string) *GotifyDB { return &GotifyDB{dsn: dsn} }

func (g *GotifyDB) Recent(ctx context.Context, limit int) ([]map[string]interface{}, error) {
	db, err := sql.Open("postgres", g.dsn)
	if err != nil { return nil, err }
	defer db.Close()
	rows, err := db.QueryContext(ctx,
		`SELECT id, title, message, date FROM messages ORDER BY id DESC LIMIT $1`, limit)
	if err != nil { return nil, err }
	defer rows.Close()
	out := []map[string]interface{}{}
	for rows.Next() {
		var id int64
		var title, message string
		var date interface{}
		if err := rows.Scan(&id, &title, &message, &date); err != nil { continue }
		out = append(out, map[string]interface{}{"id": id, "title": title, "message": message, "date": fmt.Sprint(date)})
	}
	return out, rows.Err()
}
