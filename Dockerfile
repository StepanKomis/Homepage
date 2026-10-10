FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --prefer-offline --no-audit
COPY frontend .
RUN npm run build

FROM golang:1.21-alpine AS backend-builder
WORKDIR /app/backend
RUN apk add --no-cache git
COPY backend/go.mod ./
# Generate go.sum if it doesn't exist
RUN go mod download || go mod tidy || true
RUN ls -la go.*
COPY backend .
RUN CGO_ENABLED=0 GOOS=linux go build -o server main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /app

COPY --from=backend-builder /app/backend/server ./server
COPY --from=frontend-builder /app/frontend/dist ./public

EXPOSE 4200
ENV BACKEND_HOST=0.0.0.0
ENV BACKEND_PORT=4200
ENV LOG_LEVEL=info

CMD ["./server"]
