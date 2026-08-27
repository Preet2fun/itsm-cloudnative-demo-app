# Changelog — Helm chart (itsm-app)

All notable changes are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/)

`version` = chart structure version (bump when templates change)
`appVersion` = platform release this chart deploys (bump with each phase/sprint)

## [Unreleased]

### Planned (v0.3.0 — Phase 6)
- Remove `global.imageTag: latest` — each service now has its own `image.tag`
- Add `userService.image.tag`, `assetService.image.tag`, `incidentService.image.tag`, `frontend.image.tag`
- `userService.env.JWT_PRIVATE_KEY` secret mount for RS256 key
- `userService.env.JWT_SECRET` removed (replaced by RS256 key)
- Frontend port corrected: `3000` → `80` (nginx:alpine)
- Frontend resource limits corrected: 128Mi → 64Mi request, 256Mi → 128Mi limit
- Frontend env vars removed (Istio VirtualService handles routing, not nginx proxy)

---

## [0.2.0] - 2026-05-01

### Added (Phase 5)
- Templates for all application services: user-service, asset-service, incident-service, frontend
- HPA for all stateless services (min=1, max=2, CPU threshold 70%)
- Redis StatefulSet + Service
- RabbitMQ StatefulSet + Service
- `values.yaml` (dev defaults) + `values-qa.yaml` (qa overrides)
- Resource limits per CLAUDE.md hardware constraints (3-node, 16 GB total)
- Readiness + liveness probes on all services
- `global.imageRegistry` for Docker Hub prefix

---

## [0.1.0] - 2026-04-30

### Added (Phase 5 scaffold)
- Initial `Chart.yaml`, `values.yaml` structure
- Namespace template stubs
