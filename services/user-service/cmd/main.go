// Package main is the entry point for the ITSM User Service.
//
// Responsibilities:
//   - User registration, profile management, password management
//   - JWT issuance (RS256) and refresh
//   - JWKS endpoint for Istio RequestAuthentication
//   - User CRUD — multi-tenant via search_path-per-request
//
// Configuration is read entirely from environment variables.
// See internal/config/config.go for the full list.
package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"

	"github.com/itsm-cloudnative/user-service/internal/config"
	appdb "github.com/itsm-cloudnative/user-service/internal/db"
	"github.com/itsm-cloudnative/user-service/internal/handlers"
	appmw "github.com/itsm-cloudnative/user-service/internal/middleware"
	"github.com/itsm-cloudnative/user-service/internal/repository"
	"github.com/itsm-cloudnative/user-service/internal/sessionstore"
	"github.com/itsm-cloudnative/user-service/telemetry"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	if err := run(); err != nil {
		slog.Error("startup failed", "error", err)
		os.Exit(1)
	}
}

func run() error {
	ctx := context.Background()

	// ── Configuration ─────────────────────────────────────────────────────────
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("config: %w", err)
	}
	slog.Info("config loaded", "env", cfg.Env, "port", cfg.Port)

	// ── OpenTelemetry ─────────────────────────────────────────────────────────
	shutdownTelemetry, err := telemetry.Init(ctx, cfg.ServiceName, cfg.OTELEndpoint, cfg.Env)
	if err != nil {
		// Non-fatal: log and continue without traces rather than refuse to start
		slog.Warn("otel init failed — traces disabled", "error", err)
		shutdownTelemetry = func(_ context.Context) error { return nil }
	}
	defer func() {
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := shutdownTelemetry(shutdownCtx); err != nil {
			slog.Warn("otel shutdown error", "error", err)
		}
	}()

	tracer := otel.Tracer("user-service")

	// ── Database ──────────────────────────────────────────────────────────────
	pool, err := appdb.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("database: %w", err)
	}
	defer pool.Close()
	slog.Info("database connected")

	// ── Session store (Redis) ────────────────────────────────────────────────
	sessStore, err := sessionstore.New(cfg.RedisURL)
	if err != nil {
		return fmt.Errorf("session store: %w", err)
	}
	defer sessStore.Close()

	// ── Dependencies ──────────────────────────────────────────────────────────
	repo := repository.New(pool)
	authH, err := handlers.NewAuthHandler(repo, cfg, tracer, otel.Meter(cfg.ServiceName), sessStore)
	if err != nil {
		return fmt.Errorf("auth handler: %w", err)
	}
	userH := handlers.NewUserHandler(repo, tracer)

	// ── Router ────────────────────────────────────────────────────────────────
	r := chi.NewRouter()
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Timeout(30 * time.Second))

	// Health — no auth, no tenant required
	r.Get("/api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"user-service"}`)) //nolint:errcheck
	})

	// JWKS — unauthenticated, consumed by Istio RequestAuthentication
	r.Get("/api/v1/.well-known/jwks.json", handlers.JWKS(cfg.JWTPrivateKey))

	// Auth — unauthenticated (pre-JWT) endpoints
	r.Route("/api/v1/auth", func(r chi.Router) {
		r.Post("/login", authH.Login)
		r.Post("/refresh", authH.Refresh)
		r.Post("/mfa/send", authH.MfaSend)
		r.Post("/mfa/verify", authH.MfaVerify)
	})

	// Users — require X-Tenant-ID header (injected by Istio in Phase 6;
	// sent manually in Phase 3 testing)
	r.Route("/api/v1/users", func(r chi.Router) {
		r.Use(appmw.TenantRequired)
		r.Get("/", userH.List)
		r.Post("/", userH.Create)
		r.Get("/{id}", userH.GetByID)
		r.Put("/{id}", userH.Update)
		r.Delete("/{id}", userH.Delete)
		r.Put("/{id}/password", userH.ChangePassword)
	})

	// Internal — service-to-service endpoint (no auth middleware;
	// access controlled by Istio AuthorizationPolicy ALLOW in Phase 6)
	r.Route("/internal", func(r chi.Router) {
		r.Get("/users/{id}", userH.InternalGetByID)
	})

	// Wrap the entire router with OTel HTTP instrumentation.
	// This auto-creates spans for every request and propagates W3C traceparent.
	handler := otelhttp.NewHandler(r, "user-service",
		otelhttp.WithMessageEvents(otelhttp.ReadEvents, otelhttp.WriteEvents),
	)

	// ── HTTP server ───────────────────────────────────────────────────────────
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Port),
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown on SIGTERM/SIGINT
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGTERM, syscall.SIGINT)

	go func() {
		slog.Info("user-service listening", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			quit <- syscall.SIGTERM
		}
	}()

	<-quit
	slog.Info("shutting down...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	return srv.Shutdown(shutdownCtx)
}
