# catalog-service

Language: Python (FastAPI, SQLAlchemy 2.x async) — mirrors
`platform-app/services/asset-service`'s conventions: `tenant_session()` /
`search_path`-per-request tenant isolation, `X-Tenant-ID` header, OTLP
traces/metrics exported to Platform App's OTel Collector tagged
`service.namespace=customer-app`. No Redis cache yet — deferred to the
cache-wiring step.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/health` | no tenant required |
| GET | `/api/v1/restaurants` | list, paginated |
| POST | `/api/v1/restaurants` | create |
| GET | `/api/v1/restaurants/{id}` | get |
| GET | `/api/v1/restaurants/{id}/menu-items` | list menu items |
| POST | `/api/v1/restaurants/{id}/menu-items` | create menu item |

## Config (env vars)

| Var | Required | Default |
|---|---|---|
| `DATABASE_URL` | yes | — |
| `ENV` | no | `dev` |
| `CATALOG_SERVICE_PORT` | no | `8000` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | no | `http://localhost:4317` |
| `OTEL_SERVICE_NAME` | no | `catalog-service` |
