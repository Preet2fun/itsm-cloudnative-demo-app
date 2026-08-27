# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM golang:1.24-alpine AS builder

# git is required by some go modules
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /src

# Download dependencies first (layer cache)
COPY go.mod go.sum ./
RUN go mod download

# Build the binary — static, no CGO (required for distroless)
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -ldflags="-s -w" \
    -o /bin/user-service ./cmd

# ── Stage 2: Run ─────────────────────────────────────────────────────────────
# distroless/static has no shell — minimal attack surface
FROM gcr.io/distroless/static:nonroot

# Copy TLS certs so the service can make outbound HTTPS calls (e.g. OTel exporter)
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

COPY --from=builder /bin/user-service /user-service

# Run as non-root (uid 65532 = nonroot in distroless)
USER nonroot:nonroot

EXPOSE 8080

ENTRYPOINT ["/user-service"]
