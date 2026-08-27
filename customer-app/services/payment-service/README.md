# payment-service

Language: Java 21, Spring Boot 3.2 (Web + raw JDBC — no JPA/Hibernate),
mirrors `delivery-service`'s conventions exactly: `X-Tenant-ID` →
`search_path`-per-connection tenant isolation, single `DATABASE_URL` env
var parsed manually for HikariCP, OTel Java auto-instrumentation agent
tagged `service.namespace=customer-app`.

Payments resolve synchronously on creation — there's no real external
payment gateway to await, so `amount <= 0` resolves to `failed` and
everything else resolves to `completed`. The only supported post-creation
transition is `completed → refunded`.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/health` | no tenant required |
| GET | `/api/v1/payments?orderId=` | list payments for an order |
| POST | `/api/v1/payments` | create — resolves to `completed`/`failed` immediately |
| GET | `/api/v1/payments/{id}` | get |
| PUT | `/api/v1/payments/{id}/status` | `completed → refunded` only — all other transitions rejected (400) |

## Config (env vars)

| Var | Required | Default |
|---|---|---|
| `DATABASE_URL` | yes | — |
| `PAYMENT_SERVICE_PORT` | no | `8080` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | no | `http://localhost:4317` |
| `OTEL_SERVICE_NAME` | no | `payment-service` (set in Dockerfile) |

## Local build/verify

```
mvn compile   # or: mvn package -DskipTests
mvn test
```
