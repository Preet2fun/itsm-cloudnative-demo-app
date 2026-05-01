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

Section 2 covers:
- `package.json` with exact pinned dependencies
- `Dockerfile` for the Next.js frontend (using the same venv pattern from Python services)
- `services/frontend/.env.local` template
- Helm templates: Deployment, Service, HPA for the frontend
- `values.yaml` update with `frontend:` block
- K8s Secret update (no new secrets needed — frontend reads APIs via service names)
- Docker build + push + Helm deploy steps
- Port-forward verification
- Acceptance checklist (login → dashboard → create incident → resolve → asset list)

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
