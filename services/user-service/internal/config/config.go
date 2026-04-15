package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

// Config holds all runtime configuration for the user-service.
// Every value is sourced from environment variables — no config files.
type Config struct {
	DatabaseURL    string
	JWTSecret      string
	JWTExpiryHours int
	Port           int
	Env            string // dev | qa
	OTELEndpoint   string // gRPC endpoint e.g. otel-collector:4317
	ServiceName    string
}

// Load reads configuration from environment variables.
// Returns an error if any required variable is missing or invalid.
func Load() (*Config, error) {
	cfg := &Config{
		DatabaseURL:    os.Getenv("DATABASE_URL"),
		JWTSecret:      os.Getenv("JWT_SECRET"),
		Env:            getEnvOrDefault("ENV", "dev"),
		OTELEndpoint:   getEnvOrDefault("OTEL_EXPORTER_OTLP_ENDPOINT", "localhost:4317"),
		ServiceName:    getEnvOrDefault("OTEL_SERVICE_NAME", "user-service"),
		JWTExpiryHours: 24,
		Port:           8080,
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}
	if cfg.Env != "dev" && cfg.Env != "qa" {
		return nil, fmt.Errorf("ENV must be 'dev' or 'qa', got %q", cfg.Env)
	}

	if v := os.Getenv("JWT_EXPIRY_HOURS"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 {
			return nil, fmt.Errorf("JWT_EXPIRY_HOURS must be a positive integer, got %q", v)
		}
		cfg.JWTExpiryHours = n
	}

	if v := os.Getenv("USER_SERVICE_PORT"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 || n > 65535 {
			return nil, fmt.Errorf("USER_SERVICE_PORT must be a valid port number, got %q", v)
		}
		cfg.Port = n
	}

	// Strip http:// or https:// prefix from OTLP endpoint — gRPC client expects host:port
	cfg.OTELEndpoint = strings.TrimPrefix(cfg.OTELEndpoint, "http://")
	cfg.OTELEndpoint = strings.TrimPrefix(cfg.OTELEndpoint, "https://")

	return cfg, nil
}

func getEnvOrDefault(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}
