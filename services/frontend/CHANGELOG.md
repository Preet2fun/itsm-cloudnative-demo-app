# Changelog — frontend (Synap UI)

All notable changes are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/)

UI is built sprint-by-sprint from prototypes in `design_handoff_synap/reference/`.
Each sprint = one version bump.

## [Unreleased]

### Planned (v0.2.0 — Sprint 1)
- Login page: split-screen brand panel + email/password form
- 6-digit email OTP step
- Forgot password page (stub)
- React Router: `/login` → `/login/mfa` → `/forgot-password`
- JWT stored in `localStorage` on successful MFA verify
- Wired to real `user-service` endpoints

### Planned (v0.3.0 — Sprint 2)
- App shell: sidebar, topbar, routing, theme toggle, persona switch
- Light/dark theme persisted to localStorage
- Per-route error boundary

---

## [0.1.0] - 2026-06-18

### Added (Sprint 0 — Design System Foundation)
- Vite + React 18 + TypeScript scaffold
- OKLCH design token CSS layer ported from `design_handoff_synap/reference/styles.css`
- `[data-theme="dark"]` overrides for full dark mode
- Google Fonts: Space Grotesk (display), Hanken Grotesk (UI), JetBrains Mono (mono)
- Primitive components: `Icon` (60 paths), `Button` (5 variants, 3 sizes), `IconButton`,
  `Badge`, `SevBadge`, `Card`, `CardHeader`, `Avatar`, `HealthDot`, `Sparkline`,
  `StatCard`, `Segmented`, `AiOrb`, `AiChip`, `Empty`, `CountUp`
- `useTheme` hook with localStorage persistence
- `/dev/components` preview route — all primitives in light + dark
- `nginx:alpine` Dockerfile with SPA routing (`try_files $uri $uri/ /index.html`)

### Architecture
- Vite build → `dist/` → served by `nginx:alpine`
- 64Mi request / 128Mi memory limit (fits 10–11 GB cluster workload budget)
- CSS Modules + OKLCH variables — no hardcoded colors anywhere
- Mock data layer (`src/lib/`) — real API wiring in Sprint 11
