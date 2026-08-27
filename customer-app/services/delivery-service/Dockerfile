# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /src

# Download dependencies first (layer cache)
COPY pom.xml .
RUN mvn -q dependency:go-offline

COPY src ./src
RUN mvn -q package -DskipTests

# ── Stage 2: Run ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S nonroot && adduser -S nonroot -G nonroot

WORKDIR /app

# OTel Java auto-instrumentation agent — standard approach for Java rather
# than manual SDK wiring (contrast with order-service/catalog-service, which
# use the SDK directly since Go/Python don't have an equivalent agent).
# service.namespace=customer-app is the same segregation tag both other
# services set, so Platform App's collector/agents can filter on it.
ADD https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar /app/otel-javaagent.jar

COPY --from=builder /src/target/delivery-service.jar /app/delivery-service.jar
RUN chown -R nonroot:nonroot /app

USER nonroot:nonroot

EXPOSE 8080

ENV OTEL_SERVICE_NAME=delivery-service
ENV OTEL_RESOURCE_ATTRIBUTES=service.namespace=customer-app
ENV OTEL_TRACES_EXPORTER=otlp
ENV OTEL_METRICS_EXPORTER=otlp
ENV OTEL_EXPORTER_OTLP_PROTOCOL=grpc
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-javaagent:/app/otel-javaagent.jar", "-jar", "/app/delivery-service.jar"]
