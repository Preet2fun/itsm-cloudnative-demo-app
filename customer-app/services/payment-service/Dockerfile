# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /src

COPY pom.xml .
RUN mvn -q dependency:go-offline

COPY src ./src
RUN mvn -q package -DskipTests

# ── Stage 2: Run ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S nonroot && adduser -S nonroot -G nonroot

WORKDIR /app

# OTel Java auto-instrumentation agent — same standard approach as
# delivery-service, zero telemetry code needed in the service itself.
ADD https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar /app/otel-javaagent.jar

COPY --from=builder /src/target/payment-service.jar /app/payment-service.jar
RUN chown -R nonroot:nonroot /app

USER nonroot:nonroot

EXPOSE 8080

ENV OTEL_SERVICE_NAME=payment-service
ENV OTEL_RESOURCE_ATTRIBUTES=service.namespace=customer-app
ENV OTEL_TRACES_EXPORTER=otlp
ENV OTEL_METRICS_EXPORTER=otlp
ENV OTEL_EXPORTER_OTLP_PROTOCOL=grpc
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# MaxRAMPercentage sizes the JVM heap off the container's *memory limit*
# (512Mi, per values.yaml) rather than the host's total RAM, which is what
# the JVM defaults to otherwise — without this, a container capped at 512Mi
# but scheduled on a host with several GB free would still try to size its
# default heap off the host, and get OOMKilled almost immediately. Still
# needs live validation once deployed.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-javaagent:/app/otel-javaagent.jar", "-jar", "/app/payment-service.jar"]
