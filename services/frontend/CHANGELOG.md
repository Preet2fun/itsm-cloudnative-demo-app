# Changelog — frontend (Synap UI)

All notable changes are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/)

UI is built sprint-by-sprint from prototypes in `design_handoff_synap/reference/`.
Each sprint = one version bump.

## [Unreleased]

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

---

## [0.2.0] - 2026-07-09

### Added (Sprint 1 — Authentication)
- `/login` — split-screen brand panel + email/password form (no SSO — see design spec)
- `/login/mfa` — 6-digit email OTP entry, guarded on React Router navigation state (redirects to `/login` if accessed directly)
- `/forgot-password` — stub page, same visual language, no backend call
- `/welcome` — temporary post-login landing page (App Shell arrives in Sprint 2)
- Wired to the real `user-service` endpoints: `POST /api/v1/auth/login`, `POST /api/v1/auth/mfa/send`, `POST /api/v1/auth/mfa/verify`
- JWT stored in `localStorage` on successful MFA verify (existing `lib/auth.ts`, unchanged)
- TanStack Query added for all auth mutations
- Vitest + React Testing Library added — first automated frontend tests in this repo
