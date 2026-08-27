import logging

from opentelemetry import metrics, trace
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.propagate import set_global_textmap
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import SERVICE_NAME, SERVICE_NAMESPACE, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator

logger = logging.getLogger(__name__)


def setup_telemetry(service_name: str, otlp_endpoint: str, env: str) -> None:
    # service.namespace=customer-app is how Platform App's collector/agents
    # segregate Customer App signals from its own — see
    # docs/superpowers/specs/2026-08-15-platform-customer-app-split-notes.md
    resource = Resource.create({
        SERVICE_NAME: service_name,
        SERVICE_NAMESPACE: "customer-app",
        "deployment.environment": env,
    })

    try:
        tp = TracerProvider(resource=resource)
        tp.add_span_processor(
            BatchSpanProcessor(OTLPSpanExporter(endpoint=otlp_endpoint, insecure=True))
        )
        trace.set_tracer_provider(tp)
    except Exception as exc:
        logger.warning("OTel trace exporter init failed (non-fatal): %s", exc)
        trace.set_tracer_provider(TracerProvider(resource=resource))

    try:
        mp = MeterProvider(
            resource=resource,
            metric_readers=[
                PeriodicExportingMetricReader(
                    OTLPMetricExporter(endpoint=otlp_endpoint, insecure=True)
                )
            ],
        )
        metrics.set_meter_provider(mp)
    except Exception as exc:
        logger.warning("OTel metric exporter init failed (non-fatal): %s", exc)
        metrics.set_meter_provider(MeterProvider(resource=resource))

    set_global_textmap(TraceContextTextMapPropagator())
    logger.info("OpenTelemetry initialised: service=%s endpoint=%s", service_name, otlp_endpoint)


def get_tracer() -> trace.Tracer:
    return trace.get_tracer("catalog-service")


def get_meter() -> metrics.Meter:
    return metrics.get_meter("catalog-service")
