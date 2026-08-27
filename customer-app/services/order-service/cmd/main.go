// Package main is the entry point for order-service (Customer App).
//
// Responsibilities:
//   - Order placement and lifecycle (status transitions)
//   - Multi-tenant via search_path-per-request, same pattern as Platform App
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

	"github.com/itsm-cloudnative/order-service/internal/config"
	appdb "github.com/itsm-cloudnative/order-service/internal/db"
	"github.com/itsm-cloudnative/order-service/internal/handlers"
	appmw "github.com/itsm-cloudnative/order-service/internal/middleware"
	"github.com/itsm-cloudnative/order-service/internal/repository"
	"github.com/itsm-cloudnative/order-service/telemetry"
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

	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("config: %w", err)
	}
	slog.Info("config loaded", "env", cfg.Env, "port", cfg.Port)

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

	tracer := otel.Tracer("order-service")

	pool, err := appdb.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("database: %w", err)
	}
	defer pool.Close()
	slog.Info("database connected")

	repo := repository.New(pool)
	orderH := handlers.NewOrderHandler(repo, tracer)

	r := chi.NewRouter()
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Timeout(30 * time.Second))

	r.Get("/api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"order-service"}`)) //nolint:errcheck
	})

	r.Route("/api/v1/orders", func(r chi.Router) {
		r.Use(appmw.TenantRequired)
		r.Get("/", orderH.List)
		r.Post("/", orderH.Create)
		r.Get("/{id}", orderH.GetByID)
		r.Put("/{id}/status", orderH.UpdateStatus)
	})

	handler := otelhttp.NewHandler(r, "order-service",
		otelhttp.WithMessageEvents(otelhttp.ReadEvents, otelhttp.WriteEvents),
	)

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Port),
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGTERM, syscall.SIGINT)

	go func() {
		slog.Info("order-service listening", "addr", srv.Addr)
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
