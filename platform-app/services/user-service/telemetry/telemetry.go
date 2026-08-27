// Package telemetry initialises OpenTelemetry for the user-service.
// Call Init() once at startup and defer the returned shutdown function.
//
// What is set up:
//   - OTLP gRPC trace exporter → OTel Collector (TracerProvider)
//   - OTLP gRPC metric exporter → OTel Collector (MeterProvider)
//   - W3C TraceContext + Baggage propagators (required for Istio header propagation)
//   - Both providers registered globally so otelhttp middleware, otel.Tracer(),
//     and otel.Meter() calls anywhere in the service share this setup.
package telemetry

import (
	"context"
	"errors"
	"fmt"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// Init sets up the global TracerProvider and MeterProvider and returns a
// shutdown function.
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

	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceName(serviceName),
			semconv.DeploymentEnvironment(env),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("create otel resource: %w", err)
	}

	// ── Traces ──────────────────────────────────────────────────────────────
	traceExporter, err := otlptracegrpc.New(ctx, otlptracegrpc.WithGRPCConn(conn))
	if err != nil {
		return nil, fmt.Errorf("create otlp trace exporter: %w", err)
	}
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(traceExporter),
		sdktrace.WithResource(res),
		// Sample everything in dev; switch to ParentBased(TraceIDRatioBased) in production.
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
	)
	otel.SetTracerProvider(tp)

	// ── Metrics ─────────────────────────────────────────────────────────────
	metricExporter, err := otlpmetricgrpc.New(ctx, otlpmetricgrpc.WithGRPCConn(conn))
	if err != nil {
		return nil, fmt.Errorf("create otlp metric exporter: %w", err)
	}
	mp := sdkmetric.NewMeterProvider(
		sdkmetric.WithReader(sdkmetric.NewPeriodicReader(metricExporter)),
		sdkmetric.WithResource(res),
	)
	otel.SetMeterProvider(mp)

	// W3C TraceContext + Baggage — Istio Envoy propagates traceparent automatically
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	shutdown := func(ctx context.Context) error {
		var errs []error
		if err := tp.Shutdown(ctx); err != nil {
			errs = append(errs, fmt.Errorf("tracer provider shutdown: %w", err))
		}
		if err := mp.Shutdown(ctx); err != nil {
			errs = append(errs, fmt.Errorf("meter provider shutdown: %w", err))
		}
		if err := conn.Close(); err != nil {
			errs = append(errs, fmt.Errorf("grpc conn close: %w", err))
		}
		return errors.Join(errs...)
	}

	return shutdown, nil
}
