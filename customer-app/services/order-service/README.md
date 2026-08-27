# order-service

Language: Go (Chi v5, pgx/v5, OTel) — mirrors
`platform-app/services/user-service`'s conventions exactly: `search_path`-
per-request tenant isolation, `X-Tenant-ID` header (no JWT validation in this
service — that's Istio's job once Customer App joins the mesh), OTLP traces/
metrics exported to Platform App's OTel Collector tagged
`service.namespace=customer-app`.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/health` | no tenant required |
| GET | `/api/v1/orders` | list, paginated |
| POST | `/api/v1/orders` | create |
| GET | `/api/v1/orders/{id}` | get |
| PUT | `/api/v1/orders/{id}/status` | status transition only — orders aren't edited otherwise |

## Config (env vars)

| Var | Required | Default |
|---|---|---|
| `DATABASE_URL` | yes | — |
| `ENV` | no | `dev` |
| `ORDER_SERVICE_PORT` | no | `8080` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | no | `localhost:4317` |
| `OTEL_SERVICE_NAME` | no | `order-service` |
