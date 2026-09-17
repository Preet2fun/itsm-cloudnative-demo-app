# frontend — Hearth

**Language:** TypeScript / Vite + React 18
**Status:** Login + 6-digit verify built (customer-app Phase 6, issue #45),
verified live against the deployed backend. Everything else is not built yet
— see `../../design_handoff/CLAUDE.md` and `BUILD_PLAN.md` for what's next.

Design source of truth: `customer-app/design_handoff/design_handoff_hearth/`
(the "Hearth" handoff, Aurora design system). Match it exactly for any new
screen; don't hand-design in code first — see root `CLAUDE.md` §10.

## Stack

Vite + React 18 + TypeScript, React Router, TanStack Query (server state),
Zustand (session state, persisted to `localStorage` under `hearth_session`),
CSS Modules over the Aurora token layer (`src/index.css`, ported verbatim
from the design handoff's `reference/styles.css`).

## Running locally

```bash
npm install
npm run dev       # http://localhost:5174
```

By default `/api` requests go nowhere — there's no local backend (root
`CLAUDE.md` §3: no Docker Compose, Postgres is one external instance shared
by both apps). To develop against the real, deployed customer-app backend on
the kubeadm cluster:

```bash
cp .env.local.example .env.local
# edit .env.local: VITE_API_TARGET=http://<node-ip>:30080
npm run dev
```

`vite.config.ts`'s dev-only proxy forwards `/api/*` to that target. Get
`<node-ip>` from `kubectl get nodes -o wide` on `kubernetes-master`; any of
the three node IPs works (NodePort 30080 is exposed cluster-wide). Leave
`VITE_API_HOST` unset for auth work — see the comment in `vite.config.ts` and
`../../docs/phase-03-istio-ingress-guide.md`'s routing note for why.

To log in against real data you need a seeded user — see
`customer-app/scripts/seed-customer-user.sh` — and, for the MFA step, the
dev-mode OTP from `kubectl logs -n itsm-dev deploy/user-service` (see that
script's usage comment, or `phase-03-istio-ingress-guide.md` Step 5).

## Testing

```bash
npm run test        # vitest run
npm run type-check
npm run lint
npm run build        # tsc -b && vite build
```

## Structure

```
src/
  lib/            api.ts (authApi), session-store.ts (Zustand), jwt.ts, types.ts
  pages/          Login.tsx, LoginVerify.tsx, AuthLayout.tsx (shared split panel),
                  Welcome.tsx (placeholder post-login landing — not the real
                  dashboard; that's a later roadmap task)
  index.css       Aurora design-system tokens (global)
```

One screen/feature at a time, per root `CLAUDE.md` §11 — don't build Orders,
Menu, Deliveries, or Payments here speculatively even though they're already
specced in the design handoff's `BUILD_PLAN.md`.
