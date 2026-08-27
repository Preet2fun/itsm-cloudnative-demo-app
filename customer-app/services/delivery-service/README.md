# delivery-service

Language: Java 21, Spring Boot 3.2 (Web + raw JDBC — no JPA/Hibernate, to keep
the tenant `search_path`-per-connection pattern identical to order-service
and catalog-service rather than fighting an ORM's connection/session
management).

First Java service in this repo — no existing convention to mirror, so a
few choices were made fresh:
- **Build:** Maven (`pom.xml`), no wrapper.
- **DB:** parses the single `DATABASE_URL` env var manually (same convention
  as every other service) into a JDBC URL for HikariCP — Spring Boot's own
  `spring.datasource.*` auto-config is excluded because it expects a
  JDBC-form URL, not `postgres://...`.
- **Tenant isolation:** `TenantFilter` reads `X-Tenant-ID`, validates it,
  stores it in a `ThreadLocal`; `DeliveryRepository` sets `search_path` on
  every connection it borrows before querying — same discipline as the Go
  and Python services, just without pgx/asyncpg's tenant_session helper.
- **OTel:** the Java auto-instrumentation agent (`-javaagent:`), not manual
  SDK setup — this is the standard approach for Java and needs zero
  telemetry code in the service itself. Tagged
  `service.namespace=customer-app` via `OTEL_RESOURCE_ATTRIBUTES`, same
  segregation convention as the other two services.

JVM memory footprint for this and payment-service was flagged as an open
risk during design and explicitly deferred to sizing time — not addressed
here.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/health` | no tenant required |
| GET | `/api/v1/deliveries?orderId=` | list deliveries for an order |
| POST | `/api/v1/deliveries` | assign a rider to an order |
| GET | `/api/v1/deliveries/{id}` | get |
| PUT | `/api/v1/deliveries/{id}/status` | status transition only |

## Config (env vars)

| Var | Required | Default |
|---|---|---|
| `DATABASE_URL` | yes | — |
| `DELIVERY_SERVICE_PORT` | no | `8080` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | no | `http://localhost:4317` |
| `OTEL_SERVICE_NAME` | no | `delivery-service` (set in Dockerfile) |

## Local build/verify

```
mvn compile   # or: mvn package -DskipTests
```
