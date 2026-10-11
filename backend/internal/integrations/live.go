package integrations

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"
)

// ---------- Jellyfin: active sessions / now playing ----------

type jellyfinSession struct {
	UserName  string `json:"UserName"`
	Client    string `json:"Client"`
	DeviceName string `json:"DeviceName"`
	PlayState *struct {
		PositionTicks int64 `json:"PositionTicks"`
		IsPaused      bool  `json:"IsPaused"`
	} `json:"PlayState"`
	NowPlayingItem *struct {
		Name          string `json:"Name"`
		SeriesName    string `json:"SeriesName"`
		Type          string `json:"Type"`
		ProductionYear int   `json:"ProductionYear"`
		RunTimeTicks  int64  `json:"RunTimeTicks"`
		IndexNumber   int    `json:"IndexNumber"`
		ParentIndexNumber int `json:"ParentIndexNumber"`
	} `json:"NowPlayingItem"`
}

func (im *IntegrationManager) GetJellyfinStreams(ctx context.Context) ([]map[string]interface{}, error) {
	jfURL := im.config["JELLYFIN_URL"]
	jfKey := im.config["JELLYFIN_API_KEY"]
	if jfURL == "" {
		return nil, fmt.Errorf("JELLYFIN_URL not configured")
	}
	req, _ := http.NewRequestWithContext(ctx, "GET", jfURL+"/Sessions?activeWithinSeconds=600", nil)
	if jfKey != "" {
		req.Header.Set("Authorization",
			"MediaBrowser Token="+jfKey+", Client=homepage, Device=homepage, Version=1.0, DeviceId=homepage-vega")
	}
	resp, err := im.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("jellyfin /Sessions: %s", resp.Status)
	}
	var sessions []jellyfinSession
	if err := json.Unmarshal(body, &sessions); err != nil {
		return nil, err
	}
	out := []map[string]interface{}{}
	for _, s := range sessions {
		if s.NowPlayingItem == nil {
			continue
		}
		np := s.NowPlayingItem
		m := map[string]interface{}{
			"title":  np.Name,
			"user":   s.UserName,
			"client": s.Client,
			"device": s.DeviceName,
			"paused": false,
		}
		if s.PlayState != nil {
			m["paused"] = s.PlayState.IsPaused
			if np.RunTimeTicks > 0 {
				m["progress"] = float64(s.PlayState.PositionTicks) / float64(np.RunTimeTicks)
			}
		}
		if np.SeriesName != "" {
			ep := ""
			if np.ParentIndexNumber > 0 {
				ep = fmt.Sprintf("S%dE%d", np.ParentIndexNumber, np.IndexNumber)
			}
			m["type"] = "episode"
			m["series"] = np.SeriesName
			m["ep"] = ep
		} else {
			m["type"] = "movie"
			if np.ProductionYear > 0 {
				m["year"] = np.ProductionYear
			}
		}
		out = append(out, m)
	}
	return out, nil
}

// ---------- qBittorrent: transfer queue ----------

type qbitTorrent struct {
	Name         string  `json:"name"`
	State        string  `json:"state"`
	Progress     float64 `json:"progress"`
	Size         int64   `json:"size"`
	Downloaded   int64   `json:"downloaded"`
	DlSpeed      int64   `json:"dlspeed"`
	Eta          int64   `json:"eta"`
	Category     string  `json:"category"`
}

// qbitLogin authenticates against the WebUI API and returns the SID cookie.
func (im *IntegrationManager) qbitLogin(ctx context.Context, qbURL string) (string, error) {
	user := im.config["QBITTORRENT_USERNAME"]
	pass := im.config["QBITTORRENT_PASSWORD"]
	if user == "" || pass == "" {
		return "", nil
	}
	form := url.Values{"username": {user}, "password": {pass}}
	req, _ := http.NewRequestWithContext(ctx, "POST", qbURL+"/api/v2/auth/login", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := im.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 || strings.TrimSpace(string(body)) != "Ok." {
		return "", fmt.Errorf("qbit login: %s %s", resp.Status, strings.TrimSpace(string(body)))
	}
	for _, c := range resp.Cookies() {
		if c.Name == "SID" || strings.HasPrefix(c.Name, "QBT_SID") {
			return c.Name + "=" + c.Value, nil
		}
	}
	return "", nil
}

func (im *IntegrationManager) GetQbitTorrents(ctx context.Context) ([]map[string]interface{}, error) {
	qbURL := im.config["QBITTORRENT_URL"]
	if qbURL == "" {
		return nil, fmt.Errorf("QBITTORRENT_URL not configured")
	}
	req, _ := http.NewRequestWithContext(ctx, "GET", qbURL+"/api/v2/torrents/info?limit=20", nil)
	if sid, err := im.qbitLogin(ctx, qbURL); err == nil && sid != "" {
		req.Header.Set("Cookie", sid)
	}
	resp, err := im.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("qbit /torrents/info: %s", resp.Status)
	}
	var torrents []qbitTorrent
	if err := json.Unmarshal(body, &torrents); err != nil {
		return nil, err
	}
	out := []map[string]interface{}{}
	for _, t := range torrents {
		status := "downloading"
		switch {
		case strings.Contains(t.State, "upload"), t.State == "completed":
			status = "done"
		case t.State == "pausedDL", t.State == "stoppedDL":
			status = "paused"
		case t.State == "stalledDL":
			status = "stalled"
		case t.State == "queuedDL", t.State == "metaDL":
			status = "queued"
		case t.State == "error", t.State == "missingFiles":
			status = "error"
		}
		eta := ""
		if t.Eta > 0 && t.Eta < 8640000 {
			d := time.Duration(t.Eta) * time.Second
			if d.Hours() >= 1 {
				eta = fmt.Sprintf("%dh %dm", int(d.Hours()), int(d.Minutes())%60)
			} else {
				eta = fmt.Sprintf("%dm %ds", int(d.Minutes()), int(d.Seconds())%60)
			}
		} else {
			eta = "unknown"
		}
		out = append(out, map[string]interface{}{
			"name":    t.Name,
			"status":  status,
			"progress": t.Progress,
			"size":    t.Size,
			"speed":   t.DlSpeed,
			"eta":     eta,
			"category": t.Category,
		})
	}
	return out, nil
}

// ---------- Sonarr / Radarr: calendar (upcoming) + library counts ----------

type calendarItem struct {
	SeriesTitle string `json:"seriesTitle"`
	Title       string `json:"title"`
	AirDateUtc  string `json:"airDateUtc"`
	SeasonNumber int   `json:"seasonNumber"`
	EpisodeNumber int `json:"episodeNumber"`
	HasFile     bool   `json:"hasFile"`
}

type arrMovie struct {
	Title string `json:"title"`
	IsAvailable bool `json:"isAvailable"`
	SizeOnDisk int64 `json:"sizeOnDisk"`
}

func (im *IntegrationManager) getArrCalendar(ctx context.Context, urlBase, apiKey string) ([]map[string]interface{}, error) {
	if urlBase == "" {
		return nil, fmt.Errorf("URL not configured")
	}
	now := time.Now().In(time.FixedZone("CET", 3600)).AddDate(0, 0, -2)
	end := now.AddDate(0, 0, 14)
	u, _ := url.Parse(urlBase + "/api/v3/calendar")
	q := u.Query()
	q.Set("start", now.Format("2006-01-02"))
	q.Set("end", end.Format("2006-01-02"))
	q.Set("apiKey", apiKey)
	u.RawQuery = q.Encode()
	req, _ := http.NewRequestWithContext(ctx, "GET", u.String(), nil)
	req.Header.Set("X-Api-Key", apiKey)
	resp, err := im.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("calendar: %s", resp.Status)
	}
	var items []calendarItem
	if err := json.Unmarshal(body, &items); err != nil {
		return nil, err
	}
	out := []map[string]interface{}{}
	for _, it := range items {
		air, err := time.Parse(time.RFC3339, it.AirDateUtc)
		if err != nil {
			continue
		}
		out = append(out, map[string]interface{}{
			"title":   it.SeriesTitle,
			"ep":      fmt.Sprintf("S%02dE%02d", it.SeasonNumber, it.EpisodeNumber),
			"when":    air.Format("15:04"),
			"day":     air.Format("2006-01-02"),
			"source":  "Sonarr",
			"hasFile": it.HasFile,
		})
	}
	return out, nil
}

func (im *IntegrationManager) GetUpcoming(ctx context.Context) ([]map[string]interface{}, error) {
	var all []map[string]interface{}
	if s := im.config["SONARR_URL"]; s != "" {
		items, err := im.getArrCalendar(ctx, s, im.config["SONARR_API_KEY"])
		if err == nil {
			all = append(all, items...)
		}
	}
	if r := im.config["RADARR_URL"]; r != "" {
		u, _ := url.Parse(r + "/api/v3/calendar")
		q := u.Query()
		now := time.Now().In(time.FixedZone("CET", 3600)).AddDate(0, 0, -2)
		q.Set("start", now.Format("2006-01-02"))
		q.Set("end", now.AddDate(0, 0, 14).Format("2006-01-02"))
		u.RawQuery = q.Encode()
		req, _ := http.NewRequestWithContext(ctx, "GET", u.String(), nil)
		req.Header.Set("X-Api-Key", im.config["RADARR_API_KEY"])
		resp, err := im.client.Do(req)
		if err == nil {
			body, _ := io.ReadAll(resp.Body)
			resp.Body.Close()
			var movies []arrMovie
			// Radarr calendar items reuse episode fields differently; minimal parse
			var raw []map[string]interface{}
			if json.Unmarshal(body, &raw) == nil {
				for _, m := range raw {
					title, _ := m["title"].(string)
					air, _ := m["inCinemas"].(string)
					if air == "" {
						air, _ = m["digitalRelease"].(string)
					}
					if air == "" || title == "" {
						continue
					}
					t, err := time.Parse(time.RFC3339, air)
					if err != nil {
						continue
					}
					all = append(all, map[string]interface{}{
						"title":  title,
						"ep":     "",
						"when":   t.Format("02.01."),
						"day":    t.Format("2006-01-02"),
						"source": "Radarr",
					})
				}
			}
			_ = movies
		}
	}
	sort.Slice(all, func(i, j int) bool { return all[i]["day"].(string) < all[j]["day"].(string) })
	if all == nil {
		all = []map[string]interface{}{}
	}
	return all, nil
}

// ---------- Library counts (Jellyfin + Sonarr + Radarr + Audiobookshelf) ----------

func (im *IntegrationManager) GetLibraryStats(ctx context.Context) ([]map[string]interface{}, error) {
	stats := []map[string]interface{}{}
	// Jellyfin item counts
	if jf := im.config["JELLYFIN_URL"]; jf != "" {
		key := im.config["JELLYFIN_API_KEY"]
		req, _ := http.NewRequestWithContext(ctx, "GET", jf+"/Items/Counts", nil)
		if key != "" {
			req.Header.Set("X-Emby-Token", key)
		}
		if resp, err := im.client.Do(req); err == nil {
			body, _ := io.ReadAll(resp.Body)
			resp.Body.Close()
			var c map[string]interface{}
			if json.Unmarshal(body, &c) == nil {
				stats = append(stats,
					map[string]interface{}{"label": "Movies", "value": c["MovieCount"]},
					map[string]interface{}{"label": "Series", "value": c["SeriesCount"]},
					map[string]interface{}{"label": "Episodes", "value": c["EpisodeCount"]},
				)
			}
		}
	}
	// Audiobookshelf libraries
	if abs := im.config["AUDIOBOOKSHELF_URL"]; abs != "" {
		req, _ := http.NewRequestWithContext(ctx, "GET", abs+"/api/libraries", nil)
		if key := im.config["AUDIOBOOKSHELF_API_KEY"]; key != "" {
			req.Header.Set("Authorization", "Bearer "+key)
		}
		if resp, err := im.client.Do(req); err == nil {
			body, _ := io.ReadAll(resp.Body)
			resp.Body.Close()
			var r struct {
				Libraries []struct {
					Name  string `json:"name"`
					Stats struct {
						TotalItems  int `json:"totalItems"`
						TotalDuration int `json:"totalDuration"`
					} `json:"stats"`
				} `json:"libraries"`
			}
			if json.Unmarshal(body, &r) == nil {
				for _, lib := range r.Libraries {
					hours := lib.Stats.TotalDuration / 3600
					stats = append(stats, map[string]interface{}{
						"label": lib.Name, "value": strconv.Itoa(lib.Stats.TotalItems) + " / " + strconv.Itoa(hours) + "h",
					})
				}
			}
		}
	}
	return stats, nil
}

// ---------- Uptime Kuma: monitors via MariaDB bridge API (read-only sync helper) ----------

// GetKumaHeartbeats fetches a lightweight status snapshot. Kuma has no read API key here,
// so the homepage polls a small status endpoint if KUMA_STATUS_URL is set, else skips.
func (im *IntegrationManager) GetKumaSummary(ctx context.Context) (map[string]interface{}, error) {
	u := im.config["KUMA_STATUS_URL"]
	if u == "" {
		return nil, fmt.Errorf("KUMA_STATUS_URL not configured")
	}
	req, _ := http.NewRequestWithContext(ctx, "GET", u, nil)
	resp, err := im.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	var out map[string]interface{}
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// ---------- Gotify: recent messages ----------

type gotifyMessage struct {
	ID      int    `json:"id"`
	Title   string `json:"title"`
	Message string `json:"message"`
	Date    string `json:"date"`
}

func (im *IntegrationManager) GetGotifyMessages(ctx context.Context) ([]map[string]interface{}, error) {
	gURL := im.config["GOTIFY_URL"]
	gToken := im.config["GOTIFY_CLIENT_TOKEN"]
	if gURL == "" {
		return nil, fmt.Errorf("GOTIFY_URL not configured")
	}
	req, _ := http.NewRequestWithContext(ctx, "GET", gURL+"/message?limit=10", nil)
	if gToken != "" {
		req.Header.Set("X-Gotify-Key", gToken)
	}
	resp, err := im.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("gotify /message: %s", resp.Status)
	}
	var r struct {
		Messages []gotifyMessage `json:"messages"`
	}
	if err := json.Unmarshal(body, &r); err != nil {
		return nil, err
	}
	out := []map[string]interface{}{}
	for _, m := range r.Messages {
		out = append(out, map[string]interface{}{
			"id": m.ID, "title": m.Title, "message": m.Message, "date": m.Date,
		})
	}
	return out, nil
}
