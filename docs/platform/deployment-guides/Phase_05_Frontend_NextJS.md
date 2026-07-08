# Phase 5 Deployment Guide — Frontend (Next.js 14)

## Overview

The frontend is a Next.js 14 App Router application with TypeScript and Tailwind CSS.
It provides a multi-tenant ITSM web UI: login, incident management, asset inventory,
and a dashboard. JWT is stored in an httpOnly cookie and sent with every API call.
`X-Tenant-ID` is derived from the JWT claim (injected by Istio in Phase 6; sent
manually for now).

This guide is split into two sections:

| Section | What happens | Where |
|---|---|---|
| **Section 1 — Design** | Generate UI components using Claude Design (web) | Browser → copy to repo |
| **Section 2 — Integration** | Wire components to real APIs, Dockerfile, Helm, deploy | Claude Code CLI |

---

## Section 1 — Design with Claude Design (Web)

### Step 1.1 — Open Claude Design

Go to **https://claude.ai** in your browser and open a new conversation.
Claude Design is available directly in the chat interface — just describe what you
want and Claude generates live-preview React/Next.js components.

---

### Step 1.2 — Provide the Master Context Prompt

Paste the following prompt **first**, before any design requests.
This tells Claude Design the exact constraints so every generated component
drops directly into the repo without rework.

---

```
I am building a multi-tenant ITSM (IT Service Management) web application frontend.
I need you to generate UI components for this project. Please follow these constraints
exactly — they are non-negotiable:

## Tech Stack (strict — no exceptions)
- Framework: Next.js 14 with App Router (NOT Pages Router)
- Language: TypeScript (.tsx files)
- Styling: Tailwind CSS only — NO external UI libraries (no shadcn, no MUI, no Chakra, no Radix)
- Icons: Heroicons v2 (already available via @heroicons/react)
- State: React useState / useEffect only — no Redux, no Zustand
- HTTP: native fetch() only — no axios, no React Query

## Project Structure (output files must match exactly)
services/frontend/src/
├── app/
│   ├── layout.tsx              ← root layout with sidebar + header
│   ├── page.tsx                ← redirects to /dashboard or /login
│   ├── login/page.tsx          ← login form
│   ├── dashboard/page.tsx      ← stats overview
│   ├── incidents/page.tsx      ← incident list with filters
│   ├── incidents/new/page.tsx  ← create incident form
│   ├── incidents/[id]/page.tsx ← incident detail + events timeline
│   ├── assets/page.tsx         ← asset list with filters
│   └── assets/[id]/page.tsx    ← asset detail + linked incidents
├── components/
│   ├── layout/Sidebar.tsx      ← navigation sidebar
│   ├── layout/Header.tsx       ← top bar with tenant name + user info
│   ├── ui/Badge.tsx            ← status and priority badges
│   ├── ui/Table.tsx            ← reusable data table
│   ├── ui/Modal.tsx            ← modal dialog
│   ├── ui/LoadingSpinner.tsx   ← loading state component
│   └── ui/EmptyState.tsx       ← empty list placeholder
├── lib/
│   ├── api.ts                  ← all fetch() calls to backend APIs
│   ├── auth.ts                 ← JWT cookie read helpers (client-side)
│   └── types.ts                ← all TypeScript interfaces

## Data Models (use these exact field names — they match the database)

### User (from JWT cookie claims)
```typescript
interface JWTClaims {
  sub: string;          // user ID
  email: string;
  role: "admin" | "agent" | "viewer";
  tenant_id: string;    // e.g. "tenant_a"
  exp: number;
}
```

### Incident
```typescript
interface Incident {
  id: string;
  title: string;
  description: string;
  priority: "P1" | "P2" | "P3" | "P4";
  status: "open" | "in_progress" | "resolved" | "closed";
  assigned_to: string | null;   // user ID
  related_asset: string | null; // asset ID
  sla_breach_at: string;        // ISO datetime
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

interface IncidentEvent {
  id: string;
  incident_id: string;
  event_type: "comment" | "status_change" | "assignment" | "priority_change";
  payload: Record<string, unknown>;
  actor_id: string;
  created_at: string;
}
```

### Asset
```typescript
interface Asset {
  id: string;
  name: string;
  asset_type: "hardware" | "software" | "network" | "service";
  status: "active" | "inactive" | "maintenance" | "retired";
  location: string | null;
  asset_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
```

## API Endpoints (all relative to NEXT_PUBLIC_API_BASE_URL)

### Auth (User Service — port 80, service name: user-service)
POST   /api/v1/auth/login          body: { email, password, tenant_slug }
POST   /api/v1/auth/refresh        body: { token }

### Incidents (Incident Service — port 80, service name: incident-service)
GET    /api/v1/incidents           query: priority, status, limit, offset
POST   /api/v1/incidents           body: { title, description, priority }
GET    /api/v1/incidents/{id}
PUT    /api/v1/incidents/{id}
POST   /api/v1/incidents/{id}/assign    body: { assigned_to }
POST   /api/v1/incidents/{id}/resolve   body: { resolution_notes }
GET    /api/v1/incidents/{id}/events
POST   /api/v1/incidents/{id}/events    body: { event_type, payload, actor_id }

### Assets (Asset Service — port 80, service name: asset-service)
GET    /api/v1/assets              query: asset_type, status, limit, offset
POST   /api/v1/assets              body: { name, asset_type, status, location }
GET    /api/v1/assets/{id}
PUT    /api/v1/assets/{id}
GET    /api/v1/assets/{id}/incidents

## Auth Flow
1. Login form POSTs to /api/v1/auth/login
2. Response contains { token: "eyJ..." }
3. Store token in localStorage key "itsm_token" (httpOnly cookie added in Phase 6)
4. Every API call sends header: Authorization: Bearer <token>
5. Every API call sends header: X-Tenant-ID: <tenant_id from JWT>
6. On 401 response → redirect to /login

## Design Style
- Color palette: dark sidebar (#1e293b slate-800), white main area, blue primary (#3b82f6)
- Priority badges: P1=red, P2=orange, P3=yellow, P4=green
- Status badges: open=blue, in_progress=purple, resolved=green, closed=gray
- Asset type badges: hardware=slate, software=indigo, network=cyan, service=emerald
- Font: system font stack (no Google Fonts)
- Sidebar width: 240px, fixed
- Table rows: hover highlight, clickable rows navigate to detail page
- SLA breach: show red countdown if sla_breach_at is within 2 hours

## Important Rules for Generated Code
1. Every component that fetches data must handle loading, error, and empty states
2. All API calls go through lib/api.ts — no fetch() calls inside page components
3. The X-Tenant-ID header must be sent on every non-auth API call
4. Use "use client" directive only where strictly needed (forms, interactive components)
5. Server Components for read-only pages where possible
6. No hardcoded tenant IDs or user IDs — always read from JWT
7. TypeScript strict mode — no `any` types

I will now ask you to generate components one at a time. Generate complete, 
production-ready files. Include the full file path as a comment at the top of 
each file.
```

---

### Step 1.3 — Generate Components in This Order

After pasting the master context, send these prompts **one at a time**.
Wait for each component to be generated before sending the next.

**Prompt 1 — Types and API layer:**
```
Generate the following three files:
1. services/frontend/src/lib/types.ts — all TypeScript interfaces from the data models above
2. services/frontend/src/lib/auth.ts — functions: getToken(), getTenantId(), getRole(), isAuthenticated(), logout()
3. services/frontend/src/lib/api.ts — complete API client with functions for every endpoint listed above. Use the auth helpers. Handle 401 by redirecting to /login.
```

**Prompt 2 — Layout components:**
```
Generate:
1. services/frontend/src/components/layout/Sidebar.tsx — navigation sidebar with links to Dashboard, Incidents, Assets. Show active route. Show logged-in user email and role at the bottom. Include logout button.
2. services/frontend/src/components/layout/Header.tsx — top bar showing current page title (passed as prop), tenant name from JWT, and a notification bell icon placeholder.
3. services/frontend/src/app/layout.tsx — root layout that wraps all pages with Sidebar + Header. Redirect to /login if not authenticated.
```

**Prompt 3 — Shared UI components:**
```
Generate:
1. services/frontend/src/components/ui/Badge.tsx — Badge component with variants: priority (P1/P2/P3/P4), status (open/in_progress/resolved/closed), assetType, assetStatus
2. services/frontend/src/components/ui/Table.tsx — generic sortable table with columns config prop, clickable rows
3. services/frontend/src/components/ui/LoadingSpinner.tsx — centered spinner for loading states
4. services/frontend/src/components/ui/EmptyState.tsx — empty state with icon, title, description, optional action button
5. services/frontend/src/components/ui/Modal.tsx — modal dialog with title, children, onClose
```

**Prompt 4 — Login page:**
```
Generate services/frontend/src/app/login/page.tsx — login form with:
- Email field
- Password field  
- Tenant slug field (e.g. "tenant_a") with helper text explaining it
- Submit button with loading state
- Error message display
- On success: decode JWT, store token, redirect to /dashboard
- Clean centered card layout, ITSM branding ("ITSM Portal")
```

**Prompt 5 — Dashboard page:**
```
Generate services/frontend/src/app/dashboard/page.tsx — overview dashboard with:
- Stats cards: Total Incidents, Open Incidents, P1 Incidents, Total Assets
- Recent incidents table (last 5, with priority badge, status, created time)
- SLA breach warning section (incidents breaching in < 2 hours, shown in red)
- Fetch data from api.ts on mount
```

**Prompt 6 — Incidents list page:**
```
Generate services/frontend/src/app/incidents/page.tsx — incident list with:
- Filter bar: priority dropdown (All/P1/P2/P3/P4), status dropdown, search by title
- Sortable table: Title, Priority, Status, Assigned To, SLA Breach At, Created At
- Pagination (limit 20)
- "New Incident" button → navigates to /incidents/new
- Click row → navigate to /incidents/[id]
```

**Prompt 7 — Create incident page:**
```
Generate services/frontend/src/app/incidents/new/page.tsx — create incident form with:
- Title field (required)
- Description textarea (required)
- Priority select (P1/P2/P3/P4, default P3)
- Related Asset ID field (optional, text input)
- Submit button with loading state
- On success: redirect to /incidents/[new id]
- Cancel button → back to /incidents
```

**Prompt 8 — Incident detail page:**
```
Generate services/frontend/src/app/incidents/[id]/page.tsx — incident detail with:
- Header: title, priority badge, status badge, SLA breach countdown
- Info grid: assigned to, related asset (link to /assets/[id]), created at, resolved at
- Action buttons (based on status): Assign to Me, Resolve, Add Comment
- Events timeline at the bottom: chronological list of all incident events with actor, type, payload
- Inline "Add Comment" form that posts to events endpoint
```

**Prompt 9 — Assets list page:**
```
Generate services/frontend/src/app/assets/page.tsx — asset list with:
- Filter bar: asset_type dropdown, status dropdown
- Sortable table: Name, Type, Status, Location, Created At
- "New Asset" button (opens inline form or modal)
- Click row → navigate to /assets/[id]
```

**Prompt 10 — Asset detail page:**
```
Generate services/frontend/src/app/assets/[id]/page.tsx — asset detail with:
- Header: asset name, type badge, status badge
- Info grid: location, metadata (rendered as key-value table), created at
- Linked incidents section: table of incidents where related_asset = this asset ID
- Edit status button (dropdown to change status)
```

**Prompt 11 — Root page and Next.js config:**
```
Generate:
1. services/frontend/src/app/page.tsx — simple redirect: if authenticated → /dashboard, else → /login
2. services/frontend/next.config.ts — configure rewrites so /api/user/* proxies to http://user-service/api/v1/*, /api/incidents/* proxies to http://incident-service/api/v1/*, /api/assets/* proxies to http://asset-service/api/v1/*
3. services/frontend/tailwind.config.ts — Tailwind config for the src/ directory
4. services/frontend/tsconfig.json — TypeScript config with path alias @ → src/
```

---

### Step 1.4 — Copy Artifacts to the Repo

After generating all components, copy each file to the exact path shown in the
comment at the top of the file. The target directory is:

```
services/frontend/
```

Create this directory if it doesn't exist:
```bash
mkdir -p services/frontend/src/app/login
mkdir -p services/frontend/src/app/dashboard
mkdir -p services/frontend/src/app/incidents/new
mkdir -p services/frontend/src/app/incidents/\[id\]
mkdir -p services/frontend/src/app/assets/\[id\]
mkdir -p services/frontend/src/components/layout
mkdir -p services/frontend/src/components/ui
mkdir -p services/frontend/src/lib
```

Then paste each generated file into the correct path.

---

### Step 1.5 — Section 1 Acceptance Checklist

- [ ] All 11 prompt responses received from Claude Design
- [ ] All files placed in the correct `services/frontend/src/` paths
- [ ] No `any` TypeScript types in generated code (fix if present)
- [ ] No hardcoded tenant IDs or API URLs in components
- [ ] All API calls go through `lib/api.ts`
- [ ] Confirm `next.config.ts` has the three proxy rewrites

Once all boxes are checked, proceed to Section 2.

---

## Section 2 — Integration (Claude Code CLI)

> **Start Section 2 only after Section 1 acceptance checklist is complete.**

### Prerequisites

- Docker running on the K8s master node (or a build machine with push access)
- `kubectl` configured for the `itsm-dev` namespace
- `helm` 3.15+
- Docker Hub credentials (`docker login` as `preet2fun`)
- All Phase 4 pods Running: `user-service`, `asset-service`, `incident-service`,
  `redis-0`, `rabbitmq-0`

---

### Step 2.1 — Files Added by Claude Code (already done)

The following files were created during Section 1 → Option B conversion:

| File | Purpose |
|---|---|
| `services/frontend/Dockerfile` | Multi-stage build: deps → builder → runner |
| `services/frontend/.dockerignore` | Exclude node_modules, .next, .env.local |
| `services/frontend/next.config.ts` | `output: "standalone"` enabled |
| `services/frontend/src/app/api/health/route.ts` | K8s health probe endpoint |
| `infra/helm/itsm-app/templates/frontend/deployment.yaml` | K8s Deployment |
| `infra/helm/itsm-app/templates/frontend/service.yaml` | ClusterIP Service (port 80 → 3000) |
| `infra/helm/itsm-app/templates/frontend/hpa.yaml` | HPA min=1, max=2, CPU 70% |
| `infra/helm/itsm-app/values.yaml` | `frontend:` block added |
| `infra/helm/itsm-app/values-qa.yaml` | QA overrides for frontend |

---

### Step 2.2 — Build the Docker Image

Run on the **K8s master node** (or any machine with Docker + push access):

```bash
# Pull the latest code
cd ~/itsm-cloudnative-demo-app
git pull origin main

# Build the frontend image
cd services/frontend
docker build -t preet2fun/frontend:latest .

# Verify the image starts correctly
docker run --rm -p 3000:3000 \
  -e USER_SERVICE_URL=http://localhost:8000 \
  preet2fun/frontend:latest &
sleep 5
curl -s http://localhost:3000/api/health
# Expected: {"status":"ok"}
docker stop $(docker ps -q --filter ancestor=preet2fun/frontend:latest)

# Push to Docker Hub
docker push preet2fun/frontend:latest
```

**Expected build output:**
```
[+] Building ... (3 stages)
 => [deps]    npm install
 => [builder] npm run build    ← should print "Route (app)" table
 => [runner]  COPY standalone
Successfully tagged preet2fun/frontend:latest
```

---

### Step 2.3 — Deploy with Helm

```bash
helm upgrade --install itsm-app ./infra/helm/itsm-app \
  -n itsm-dev \
  --set frontend.image.pullPolicy=Always

# Watch the frontend pod come up
kubectl get pods -n itsm-dev -w

# Expected within ~60s:
# NAME                        READY   STATUS    RESTARTS   AGE
# frontend-xxxx               1/1     Running   0          45s
```

---

### Step 2.4 — Verify the Deployment

```bash
# Health probe
kubectl exec -n itsm-dev deploy/frontend -- \
  wget -qO- http://localhost:3000/api/health
# Expected: {"status":"ok"}

# Port-forward to test the full UI
kubectl port-forward -n itsm-dev svc/frontend 3000:80

# Open in your browser: http://localhost:3000
# You should see the ITSM Portal login page.
```

---

### Step 2.5 — Acceptance Test (Golden Path)

With the port-forward running, walk through this flow in the browser:

| Step | Action | Expected result |
|---|---|---|
| 1 | Open `http://localhost:3000` | Redirected to `/login` |
| 2 | Login: workspace=`tenant_a`, email=`alice@tenant-a.io`, password=`admin123` | JWT stored, redirect to `/dashboard` |
| 3 | Dashboard loads | Stats cards, SLA section, recent incidents table visible |
| 4 | Click **Incidents** in sidebar | Incident list with filters |
| 5 | Click **New Incident** | Form page at `/incidents/new` |
| 6 | Fill in title + description (P1) → Submit | Redirect to incident detail page |
| 7 | Click **Resolve** on an open incident | Modal → submit → status badge changes to Resolved |
| 8 | Click **Assets** in sidebar | Asset list loads |
| 9 | Click any asset row | Asset detail with metadata + linked incidents |
| 10 | Click **Sign out** in sidebar | Redirect to `/login`, localStorage cleared |

---

### Step 2.6 — Section 2 Acceptance Checklist

- [ ] `docker build` completes without errors
- [ ] `curl http://localhost:3000/api/health` returns `{"status":"ok"}`
- [ ] `docker push preet2fun/frontend:latest` succeeds
- [ ] Helm upgrade completes: `frontend-xxxx` pod is `1/1 Running`
- [ ] Browser login works with real credentials (not mock data)
- [ ] Dashboard fetches live incident and asset counts from backend
- [ ] Create incident → new record appears in incident list
- [ ] Resolve incident → status updates in real time
- [ ] Asset detail shows live linked incidents
- [ ] Sign out clears session and returns to login

---

## Troubleshooting (Section 2)

### Build error: `Cannot find module 'next'`
The `deps` stage failed. Run `docker build --no-cache` to force a clean install.

### Build error: `output: 'standalone'` not found in `.next`
Confirm `next.config.ts` has `output: "standalone"` uncommented (not commented out).

### Pod stuck in `ImagePullBackOff`
```bash
kubectl describe pod -n itsm-dev <frontend-pod-name>
# If "not found": the push didn't complete. Re-push:
docker push preet2fun/frontend:latest
# Then force a rollout:
kubectl rollout restart deployment/frontend -n itsm-dev
```

### Pod `CrashLoopBackOff` — `ECONNREFUSED` to user-service/incident-service/asset-service
The Next.js rewrites can't reach a backend service. Check:
```bash
kubectl get svc -n itsm-dev
# All three services must exist: user-service, asset-service, incident-service
kubectl logs -n itsm-dev deploy/frontend
```

### Login returns 401 / "Invalid credentials"
The user-service is reachable but credentials are wrong. Confirm the tenant slug
matches exactly what was seeded in Phase 3 (e.g. `tenant_a`, not `acme`).

### Sidebar collapse doesn't shrink the main content area
Expected — the CSS sync via `#main-content` relies on client JS. If the sidebar
collapses but the content doesn't shift, hard-refresh the page. Full fix is in Phase 6
when we wire up a shared context.

---

## Troubleshooting (Section 1)

### Claude Design generates Pages Router code (getServerSideProps etc.)
Re-send the master context prompt and add: "I need App Router only. Do not use
getServerSideProps, getStaticProps, or pages/ directory. Use async Server
Components and the fetch() API."

### Generated component uses shadcn or another UI library
Add to your next prompt: "Do not import from @/components/ui/shadcn or any
external component library. Use plain Tailwind CSS classes only."

### TypeScript errors after copying
Common fix: ensure `tsconfig.json` has `"paths": { "@/*": ["./src/*"] }` so
the `@/` import alias resolves correctly.
