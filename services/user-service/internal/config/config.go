package config

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"os"
	"strconv"
	"strings"
)

// Config holds all runtime configuration for the user-service.
// Every value is sourced from environment variables — no config files.
type Config struct {
	DatabaseURL    string
	JWTPrivateKey  *rsa.PrivateKey // RS256 signing key (Phase 6+)
	JWTExpiryHours int
	Port           int
	Env            string // dev | qa
	OTELEndpoint   string // gRPC endpoint e.g. otel-collector:4317
	ServiceName    string
	RedisURL       string
	SMTPHost       string // empty = dev mode: OTP logged to stdout instead of emailed
}

// Load reads configuration from environment variables.
// Returns an error if any required variable is missing or invalid.
func Load() (*Config, error) {
	cfg := &Config{
		DatabaseURL:    os.Getenv("DATABASE_URL"),
		Env:            getEnvOrDefault("ENV", "dev"),
		OTELEndpoint:   getEnvOrDefault("OTEL_EXPORTER_OTLP_ENDPOINT", "localhost:4317"),
		ServiceName:    getEnvOrDefault("OTEL_SERVICE_NAME", "user-service"),
		RedisURL:       os.Getenv("REDIS_URL"),
		SMTPHost:       getEnvOrDefault("SMTP_HOST", ""),
		JWTExpiryHours: 24,
		Port:           8080,
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.RedisURL == "" {
		return nil, fmt.Errorf("REDIS_URL is required")
	}
	if cfg.Env != "dev" && cfg.Env != "qa" {
		return nil, fmt.Errorf("ENV must be 'dev' or 'qa', got %q", cfg.Env)
	}

	// Parse RSA-2048 private key from PEM (accepts PKCS#1 or PKCS#8)
	privPEM := os.Getenv("JWT_PRIVATE_KEY")
	if privPEM == "" {
		return nil, fmt.Errorf("JWT_PRIVATE_KEY is required")
	}
	block, _ := pem.Decode([]byte(privPEM))
	if block == nil {
		return nil, fmt.Errorf("JWT_PRIVATE_KEY: invalid PEM block")
	}
	privKey, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		// Fall back to PKCS#8 (openssl genpkey output)
		raw, err2 := x509.ParsePKCS8PrivateKey(block.Bytes)
		if err2 != nil {
			return nil, fmt.Errorf("JWT_PRIVATE_KEY: cannot parse RSA private key: %w", err)
		}
		var ok bool
		privKey, ok = raw.(*rsa.PrivateKey)
		if !ok {
			return nil, fmt.Errorf("JWT_PRIVATE_KEY: key is not RSA")
		}
	}
	cfg.JWTPrivateKey = privKey

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
