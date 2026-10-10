package websocket

import (
	"context"
	"encoding/json"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"go.uber.org/zap"
	"homepage/internal/models"
)

type Hub struct {
	clients    map[*Client]bool
	Broadcast  chan *models.WSMessage
	Register   chan *Client
	Unregister chan *Client
	mu         sync.RWMutex
	logger     *zap.Logger
}

type Client struct {
	Hub  *Hub
	Conn *websocket.Conn
	Send chan *models.WSMessage
}

func NewHub(logger *zap.Logger) *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		Broadcast:  make(chan *models.WSMessage, 256),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		logger:     logger,
	}
}

func (h *Hub) Run(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case client := <-h.Register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			h.logger.Debug("client registered", zap.Int("total_clients", len(h.clients)))

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
			}
			h.mu.Unlock()
			h.logger.Debug("client unregistered", zap.Int("total_clients", len(h.clients)))

		case msg := <-h.Broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.Send <- msg:
				default:
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) BroadcastMessage(msg *models.WSMessage) {
	h.Broadcast <- msg
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadDeadline(time.Time{})
	for {
		var msg json.RawMessage
		if err := c.Conn.ReadJSON(&msg); err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				c.Hub.logger.Error("websocket error", zap.Error(err))
			}
			return
		}
	}
}

func (c *Client) WritePump() {
	defer c.Conn.Close()
	for {
		select {
		case msg := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(15 * time.Second))
			if err := c.Conn.WriteJSON(msg); err != nil {
				return
			}
		}
	}
}
