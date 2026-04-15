// Package telemetry initialises OpenTelemetry for the user-service.
// Call Init() once at startup and defer the returned shutdown function.
//
// What is set up:
//   - OTLP gRPC trace exporter → OTel Collector
//   - W3C TraceContext + Baggage propagators (required for Istio header propagation)
//   - TracerProvider registered globally so otelhttp middleware and manual spans share context
package telemetry

import (
	"context"
	"fmt"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// Init sets up the global TracerProvider and returns a shutdown function.
// endpoint: OTel Collector gRPC address, e.g. "otel-collector.itsm-dev:4317"
// serviceName: value of OTEL_SERVICE_NAME, e.g. "user-service"
// env: "dev" or "qa"
func Init(ctx context.Context, serviceName, endpoint, env string) (func(context.Context) error, error) {
	conn, err := grpc.NewClient(endpoint,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		return nil, fmt.Errorf("dial otel collector %s: %w", endpoint, err)
	}

	exporter, err := otlptracegrpc.New(ctx, otlptracegrpc.WithGRPCConn(conn))
	if err != nil {
		return nil, fmt.Errorf("create otlp exporter: %w", err)
	}

	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceName(serviceName),
			semconv.DeploymentEnvironment(env),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("create otel resource: %w", err)
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
		// Sample everything in dev; switch to ParentBased(TraceIDRatioBased) in production.
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
	)

	// Register globally so otelhttp middleware and manual spans share the same provider
	otel.SetTracerProvider(tp)

	// W3C TraceContext + Baggage — Istio Envoy propagates traceparent automatically
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	shutdown := func(ctx context.Context) error {
		if err := tp.Shutdown(ctx); err != nil {
			return fmt.Errorf("tracer provider shutdown: %w", err)
		}
		return conn.Close()
	}

	return shutdown, nil
}
