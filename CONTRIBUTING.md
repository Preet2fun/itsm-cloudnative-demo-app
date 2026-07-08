# Contributing

## Git Workflow

This project uses a trunk-based development workflow. The `main` branch is always deployable.

### Branch Naming

```
feat/<short-description>       # New feature
fix/<short-description>        # Bug fix
infra/<short-description>      # Infrastructure / Helm / K8s / Istio / OPA changes
docs/<short-description>       # Documentation only
chore/<short-description>      # Tooling, dependencies, CI
```

Examples:
```
feat/incident-rbac-opa
infra/istio-virtual-service-tenant-b
fix/asset-cache-invalidation
docs/otel-manual-instrumentation-guide
```

### Commit Convention (Conventional Commits)

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `infra`, `docs`, `chore`, `test`, `refactor`

**Scopes:** `user-svc`, `asset-svc`, `incident-svc`, `notification-svc`, `ai-svc`, `frontend`, `helm`, `istio`, `opa`, `argocd`, `observability`, `db`, `ci`

Examples:
```
feat(incident-svc): add RabbitMQ publisher for incident.created events
infra(opa): add viewer role RBAC rules to rbac.rego
fix(asset-svc): invalidate Redis cache on asset status update
docs(istio): add tenant routing walkthrough to 02_Istio.md
```

---

## Pull Request Process

1. Branch from `main`
2. Make changes — one logical unit per PR
3. Ensure checklist passes before opening PR:

### PR Checklist

- [ ] All unit tests pass for changed service
- [ ] `golangci-lint` clean (Go services)
- [ ] `ruff check` clean (Python services)
- [ ] `eslint` clean (frontend)
- [ ] `helm lint infra/helm/itsm-app/` passes (for infra changes)
- [ ] `opa test ./policies/rego/` passes (for policy changes)
- [ ] Docs updated if behaviour changed
- [ ] Phase status table updated in `SYSTEM_PROMPT.md` if phase complete
- [ ] No hardcoded secrets, IPs, or credentials

4. Request review
5. Squash-merge to `main` after approval

---

## Code Style

### Go
- Format: `gofmt` (enforced by CI)
- Lint: `golangci-lint run` with default config
- Error handling: always handle errors explicitly, no `_` discards on errors
- No `init()` functions except for OTel setup

### Python
- Format: `ruff format` 
- Lint: `ruff check`
- Type hints: required on all function signatures
- Async: all DB and external I/O must be async

### TypeScript / Next.js
- Format: `prettier`
- Lint: `eslint`

### Rego (OPA policies)
- All policies in `policies/rego/`
- Every policy file must have a corresponding `_test.rego` file
- Run tests: `opa test ./policies/rego/ -v`
- Default deny: every policy starts with `default allow = false`

---

## Environment Variables

Never commit `.env` files. Use `.env.example` as a reference template.
All secrets are managed via Kubernetes Secrets — see `docs/platform/deployment/01_K8s_Deployment.md`.

---

## Local OPA Policy Testing

```bash
# Run all policy unit tests
opa test ./policies/rego/ -v

# Evaluate a single policy decision manually
opa eval \
  --data policies/rego/ \
  --input - \
  'data.itsm.authz.allow' << 'EOF'
{
  "attributes": {
    "request": {
      "http": {
        "method": "DELETE",
        "path": "/api/v1/incidents/123",
        "headers": {
          "x-user-role": "viewer",
          "x-tenant-id": "tenant-a"
        }
      }
    }
  }
}
EOF
# Expected: {"result": false}
```
