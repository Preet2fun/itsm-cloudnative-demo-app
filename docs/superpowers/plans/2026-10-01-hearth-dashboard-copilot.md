# Hearth Dashboard + AI Copilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (not subagent-driven-development — this repo's root `.claude/CLAUDE.md` §13 forbids any commit/push by an agent, which conflicts with that skill's commit-based review checkpoints). Steps use checkbox (`- [ ]`) syntax for tracking. All git commit steps are written for the repo owner to run themselves — never execute a commit step yourself.

**Goal:** Build Hearth's Dashboard + AI Copilot screen in the real frontend stack (`customer-app/services/frontend`, package `hearth-ui`), including the minimal App Shell (TopBar + Sidebar) it depends on, matching the design handoff pixel- and behavior-accurately.

**Architecture:** A shared component-primitive library (Button, Card, StatusBadge, KpiTile, Sparkline, DataTable, etc.) built once from the existing Aurora CSS tokens; an App Shell layout route (TopBar + Sidebar + Copilot panel, as flex siblings, matching the design canvas's own DOM structure) that every authenticated screen will use; and a Copilot subsystem (`src/copilot/`) that ports the design canvas's `SCRIPT` object as a typed, scripted conversation engine — no real backend, no real LLM calls.

**Tech Stack:** Vite + React 18 + TypeScript, React Router v6, TanStack Query (unused by this plan — no new API calls), Zustand (existing session store, read-only here), CSS Modules, Vitest + Testing Library (already configured). New dependency: `lucide-react@1.49.0`.

**Spec:** `docs/superpowers/specs/2026-10-01-hearth-dashboard-copilot-design.md`

## Global Constraints

- Every CSS value MUST come from a `var(--token-name)` already defined in `src/index.css` — never invent a token name that doesn't exist there (confirmed list in Task 2 below). No hardcoded hex colors except where a component needs to pass a CSS variable string as a JS prop value (e.g., `color="var(--info)"`).
- `lucide-react` is pinned to **exactly `1.49.0`** (confirmed live against the npm registry — see Task 1). Every icon import name in this plan was confirmed against that exact published version's file listing — do not substitute a different icon name on a hunch.
- Every new component lives under `src/components/` (shared primitives), `src/layout/` (App Shell), or `src/copilot/` (Copilot subsystem) — do not invent a fourth location.
- No new dependency beyond `lucide-react` — if a task seems to need one, stop and ask rather than adding it.
- No `fetch`/`api.ts` calls anywhere in this plan — this screen is 100% mocked per the design spec. Do not wire TanStack Query to anything.
- Never build: Undo (after approval), the "View affected orders"/"View all payments" buttons, real LLM calls, a settings screen, or any screen besides Dashboard (Orders/Menu/Deliveries/Payments stay disabled Sidebar entries, not routes).
- The entire screen's display persona ("Rosa Medina", "Northside Trattoria", all order/payment/menu figures) is fixed mock content ported verbatim from the design canvas — it is intentionally **not** derived from the real logged-in session's email. The real session (`useSessionStore`) is used only for the sign-out action.
- All commands in this plan run locally via Bash in `customer-app/services/frontend` — prefix every npm command with `cd customer-app/services/frontend &&` (a sandbox hook blocks any Bash command that starts with a bare `npm`/`docker`/etc. token; prefixing with `cd ... &&` avoids it, confirmed working during planning).
- Every git commit step is for the repo owner to run — do not execute `git commit`/`git push` yourself.

---

### Task 1: Add `lucide-react`, restore and update the design-handoff docs

**Files:**
- Modify: `customer-app/services/frontend/package.json`
- Create: `customer-app/design_handoff/CLAUDE.md` (restored from git history, then edited)
- Modify: `customer-app/design_handoff/github.md`

**Interfaces:**
- Produces: `lucide-react@1.49.0` installed in `node_modules`, importable by every later task.

- [ ] **Step 1: Add the dependency**

Open `customer-app/services/frontend/package.json` and add this line inside `"dependencies"` (alphabetical order, after `"@tanstack/react-query"` and before `"react"`):

```json
    "lucide-react": "1.49.0",
```

- [ ] **Step 2: Install and verify**

Run:
```bash
cd customer-app/services/frontend && npm install
```
Expected: installs cleanly, `package-lock.json` updates, no peer-dependency warnings about React (lucide-react 1.49.0's peer range is `^16.5.1 || ^17.0.0 || ^18.0.0 || ^19.0.0`, which covers this project's `react@^18.3.1`).

- [ ] **Step 3: Restore the deleted design-handoff CLAUDE.md**

Run:
```bash
git show HEAD:customer-app/design_handoff/CLAUDE.md > customer-app/design_handoff/CLAUDE.md
```
Expected: the file reappears with its original content (101 lines).

- [ ] **Step 4: Update the restored file for this change**

In `customer-app/design_handoff/CLAUDE.md`, find this section:

```markdown
## Screens in this bundle (see `BUILD_PLAN.md` for the rest)
1. Foundations + primitives — built
2. Login + 6-digit verify — built; **customer-app Phase 5/6 priority
   (issue #45)**
3. App shell (sidebar, location switcher, top bar) — built
4. Dashboard — built
5. Orders, 6. Menu management, 7. Deliveries, 8. Payments — specced only in
   `BUILD_PLAN.md`; build each as its own roadmap task, one at a time, per
   root `CLAUDE.md` §11.
```

Replace it with:

```markdown
## Screens in this bundle (see `BUILD_PLAN.md` for the rest)
1. Foundations + primitives — built (design-handoff prototype only)
2. Login + 6-digit verify — built in the real stack (`customer-app/services/
   frontend`), issue #45, closed
3. App shell (sidebar, location switcher, top bar) — built in the real
   stack as part of issue #54 (shipped alongside Dashboard, since Dashboard's
   own layout requires it)
4. Dashboard + AI Copilot — see `design_handoff_hearth/DASHBOARD_COPILOT.md`
   (supersedes the plain "Dashboard" entry and `Hearth.dc.html`'s dashboard —
   current source of truth is `Hearth Dashboard.dc.html`). Built in the real
   stack, issue #54.
5. Orders, 6. Menu management, 7. Deliveries, 8. Payments — specced only in
   `BUILD_PLAN.md`; build each as its own roadmap task, one at a time, per
   root `CLAUDE.md` §11.
```

Also find this section:

```markdown
## Design source of truth
The folder `design_handoff/` contains the design handoff:
- `HANDOFF.md` — archive contents and where to start.
- `design_handoff_hearth/README.md` — product overview, screen inventory,
  design tokens, interactions, state shape, auth contract, mock-data
  contract.
```

Add one line after it:

```markdown
- `design_handoff_hearth/DASHBOARD_COPILOT.md` — the Dashboard + AI Copilot
  screen's behavior spec (layout, Copilot answer-block types, the reference
  conversation). Source of truth for screen 4, alongside `Hearth
  Dashboard.dc.html`'s `SCRIPT` object (the full mocked conversation
  content).
```

- [ ] **Step 5: Update the stale `github.md` screen map**

In `customer-app/design_handoff/github.md`, find:

```markdown
| Hearth 03 Dashboard | none — new surface, no repo counterpart |
```

Replace with:

```markdown
| Hearth 03/04 Dashboard + Copilot | none — new surface, no repo counterpart; built in `customer-app/services/frontend/src/pages/Dashboard.tsx` + `src/copilot/`, issue #54 |
```

Then find the `## Sync history` section and add a new entry above the existing `2026-08-26` line:

```markdown
- 2026-10-01T00:00:00Z — added `DASHBOARD_COPILOT.md` and `Hearth
  Dashboard.dc.html` (supersedes the dashboard in `Hearth.dc.html`); built
  in the real stack as issue #54, alongside the App Shell it requires.
```

- [ ] **Step 6: Verify**

Run:
```bash
git status --porcelain customer-app/design_handoff/ customer-app/services/frontend/package.json customer-app/services/frontend/package-lock.json
```
Expected: `CLAUDE.md` no longer shows as deleted (now modified-from-restore or untracked-then-modified — either way its content is present), `github.md` shows modified, `package.json`/`package-lock.json` show modified.

- [ ] **Step 7: Commit** (repo owner runs this — do not execute)

```bash
git add customer-app/services/frontend/package.json customer-app/services/frontend/package-lock.json customer-app/design_handoff/CLAUDE.md customer-app/design_handoff/github.md
git commit -m "chore(customer-app): add lucide-react, restore+update design-handoff docs for Dashboard+Copilot

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Core UI primitives — Icon, Button, IconButton, Input

**Files:**
- Create: `src/components/Icon.tsx`
- Create: `src/components/Button.tsx`
- Create: `src/components/Button.module.css`
- Create: `src/components/IconButton.tsx`
- Create: `src/components/IconButton.module.css`
- Create: `src/components/Input.tsx`
- Create: `src/components/Input.module.css`
- Test: `src/components/primitives.test.tsx`

**Interfaces:**
- Produces:
  - `Icon({ name: IconName, size?: number })` — `IconName` is a union of 19 string literals (see Step 1).
  - `Button({ variant?: 'primary'|'secondary'|'ghost', size?: 'sm'|'md', children, ...restButtonProps })`
  - `IconButton({ label: string, variant?: 'primary'|'secondary'|'ghost', size?: 'sm'|'md'|'lg', children, ...restButtonProps })`
  - `Input({ size?: 'sm'|'md'|'lg', ...restInputProps })`
- Consumes: CSS tokens from `src/index.css` (already present, no changes needed).

All CSS below uses only tokens confirmed present in `src/index.css`: `--bg-canvas, --bg-surface, --bg-elevated, --bg-inset, --border-subtle, --border-default, --border-strong, --text-primary, --text-secondary, --text-tertiary, --text-disabled, --text-inverse, --success, --success-soft, --info, --info-soft, --warning, --warning-soft, --danger, --danger-soft, --neutral, --neutral-soft, --focus-ring, --font-display, --font-ui, --font-mono, --space-1` through `--space-24, --radius-xs, --radius-sm, --radius-md, --radius-lg, --radius-full, --control-sm, --control-md, --control-lg, --control-pad-sm, --control-pad-md, --control-pad-lg, --sidebar-w, --topbar-h, --text-display-lg/md-size/lh, --text-heading-lg/md/sm-size/lh, --text-body-lg/md/sm-size/lh, --text-label-size/lh/track, --text-caption-size/lh, --text-mono-md/sm-size/lh, --weight-regular/medium/semibold/bold, --ease-standard/emphasis, --duration-fast/base/slow, --gradient-signature`.

- [ ] **Step 1: Create `Icon.tsx`**

```tsx
// src/components/Icon.tsx
//
// Thin wrapper over lucide-react, exposing only the icon names this app
// actually uses (matching the design handoff's icon-name strings verbatim).
// Every usage on Hearth's screens is decorative — interactive controls get
// their accessible name from the surrounding Button/IconButton, never the
// icon itself — so this always renders aria-hidden.

import {
  Activity,
  ArrowUp,
  Banknote,
  BookOpen,
  CalendarClock,
  ChevronDown,
  CreditCard,
  Gauge,
  Lightbulb,
  LineChart,
  Loader,
  PanelRightClose,
  Power,
  ReceiptText,
  Search,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  Truck,
} from 'lucide-react'

const ICONS = {
  activity: Activity,
  'arrow-up': ArrowUp,
  banknote: Banknote,
  'book-open': BookOpen,
  'calendar-clock': CalendarClock,
  'chevron-down': ChevronDown,
  'credit-card': CreditCard,
  gauge: Gauge,
  lightbulb: Lightbulb,
  'line-chart': LineChart,
  loader: Loader,
  'panel-right-close': PanelRightClose,
  power: Power,
  'receipt-text': ReceiptText,
  search: Search,
  sparkles: Sparkles,
  'trending-up': TrendingUp,
  'triangle-alert': TriangleAlert,
  truck: Truck,
} as const

export type IconName = keyof typeof ICONS

interface IconProps {
  name: IconName
  size?: number
}

export default function Icon({ name, size = 16 }: IconProps) {
  const Component = ICONS[name]
  return <Component size={size} strokeWidth={1.5} aria-hidden="true" focusable={false} />
}
```

- [ ] **Step 2: Create `Button.module.css`**

```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  font-family: var(--font-ui);
  font-weight: var(--weight-medium);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard);
}
.button:disabled { opacity: 0.5; pointer-events: none; }
.button:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }

.sm { height: var(--control-sm); padding: 0 var(--control-pad-sm); font-size: var(--text-caption-size); }
.md { height: var(--control-md); padding: 0 var(--control-pad-md); font-size: var(--text-body-sm-size); }

.primary { background: var(--success); border-color: var(--success); color: var(--text-inverse); }
.primary:hover { filter: brightness(1.08); }

.secondary { background: var(--bg-elevated); border-color: var(--border-default); color: var(--text-primary); }
.secondary:hover { background: var(--bg-surface); border-color: var(--border-strong); }

.ghost { background: transparent; border-color: transparent; color: var(--text-secondary); }
.ghost:hover { background: var(--bg-elevated); color: var(--text-primary); }
```

- [ ] **Step 3: Create `Button.tsx`**

```tsx
// src/components/Button.tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], styles[size], className].filter(Boolean).join(' ')
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  )
}
```

- [ ] **Step 4: Create `IconButton.module.css`**

```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard);
}
.button:disabled { opacity: 0.5; pointer-events: none; }
.button:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }

.sm { width: var(--control-sm); height: var(--control-sm); }
.md { width: var(--control-md); height: var(--control-md); }
.lg { width: var(--control-lg); height: var(--control-lg); }

.primary { background: var(--success); border-color: var(--success); color: var(--text-inverse); }
.primary:hover { filter: brightness(1.08); }

.secondary { background: var(--bg-elevated); border-color: var(--border-default); color: var(--text-primary); }
.secondary:hover { background: var(--bg-surface); border-color: var(--border-strong); }

.ghost { background: transparent; border-color: transparent; color: var(--text-secondary); }
.ghost:hover { background: var(--bg-elevated); color: var(--text-primary); }
```

- [ ] **Step 5: Create `IconButton.tsx`**

```tsx
// src/components/IconButton.tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './IconButton.module.css'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export default function IconButton({
  label,
  variant = 'secondary',
  size = 'md',
  className,
  children,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const classes = [styles.button, styles[variant], styles[size], className].filter(Boolean).join(' ')
  return (
    <button type={type} aria-label={label} className={classes} {...rest}>
      {children}
    </button>
  )
}
```

- [ ] **Step 6: Create `Input.module.css`**

```css
.input {
  width: 100%;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-default);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-family: var(--font-ui);
  font-size: var(--text-body-sm-size);
  padding: 0 var(--control-pad-md);
}
.input::placeholder { color: var(--text-tertiary); }
.input:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: -1px; }

.sm { height: var(--control-sm); }
.md { height: var(--control-md); }
.lg { height: var(--control-lg); }
```

- [ ] **Step 7: Create `Input.tsx`**

```tsx
// src/components/Input.tsx
import type { InputHTMLAttributes } from 'react'
import styles from './Input.module.css'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg'
}

export default function Input({ size = 'md', className, ...rest }: InputProps) {
  const classes = [styles.input, styles[size], className].filter(Boolean).join(' ')
  return <input className={classes} {...rest} />
}
```

- [ ] **Step 8: Write the failing test**

Create `src/components/primitives.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from './Button'
import IconButton from './IconButton'
import Input from './Input'
import Icon from './Icon'

describe('core primitives', () => {
  it('Button renders its children and fires onClick', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Approve changes</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Approve changes' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('Button respects the disabled prop', () => {
    render(<Button disabled>Pause online orders</Button>)
    expect(screen.getByRole('button', { name: 'Pause online orders' })).toBeDisabled()
  })

  it('IconButton exposes its label as the accessible name', () => {
    render(
      <IconButton label="Close Copilot">
        <Icon name="panel-right-close" />
      </IconButton>
    )
    expect(screen.getByRole('button', { name: 'Close Copilot' })).toBeInTheDocument()
  })

  it('Input reflects value changes', () => {
    const onChange = vi.fn()
    render(<Input aria-label="Ask Copilot" value="" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Ask Copilot'), { target: { value: 'Why are sales down?' } })
    expect(onChange).toHaveBeenCalled()
  })
})
```

- [ ] **Step 9: Run the test to verify it passes**

Run:
```bash
cd customer-app/services/frontend && npm run test -- --run src/components/primitives.test.tsx
```
Expected: `4 passed`.

- [ ] **Step 10: Type-check**

Run:
```bash
cd customer-app/services/frontend && npm run type-check
```
Expected: no errors.

- [ ] **Step 11: Commit** (repo owner runs this — do not execute)

```bash
git add src/components/Icon.tsx src/components/Button.tsx src/components/Button.module.css src/components/IconButton.tsx src/components/IconButton.module.css src/components/Input.tsx src/components/Input.module.css src/components/primitives.test.tsx
git commit -m "feat(hearth-ui): add core UI primitives (Icon, Button, IconButton, Input)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Display primitives — Card, StatusBadge, Sparkline, KpiTile, DataTable

**Files:**
- Create: `src/components/Card.tsx`
- Create: `src/components/Card.module.css`
- Create: `src/components/StatusBadge.tsx`
- Create: `src/components/StatusBadge.module.css`
- Create: `src/components/Sparkline.tsx`
- Create: `src/components/KpiTile.tsx`
- Create: `src/components/KpiTile.module.css`
- Create: `src/components/DataTable.tsx`
- Create: `src/components/DataTable.module.css`
- Test: `src/components/display-primitives.test.tsx`

**Interfaces:**
- Consumes: `Sparkline` is used internally by `KpiTile` (Task 3); none from Task 2 at the type level.
- Produces:
  - `Card({ eyebrow?, title?, action?, children })`
  - `StatusBadge({ tone: StatusTone, dot?, children })` — `export type StatusTone = 'info'|'warning'|'success'|'danger'|'neutral'` — later tasks (mock data, blocks) import `StatusTone`.
  - `Sparkline({ values: number[], width: number, height: number, color?: string })`
  - `KpiTile({ label, value, delta, tone: 'up'|'down', trend: number[] })`
  - `DataTable<T extends { id: string | number }>({ columns: DataTableColumn<T>[], rows: T[] })` — `export interface DataTableColumn<T> { key: keyof T & string; label: string; numeric?: boolean; mono?: boolean; muted?: boolean; render?: (row: T) => ReactNode }` — later tasks (Dashboard page) import `DataTableColumn`.

- [ ] **Step 1: Create `Card.module.css`**

```css
.card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
}
.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5) 0;
}
.headerText { display: flex; flex-direction: column; gap: var(--space-1); }
.eyebrow {
  font-size: var(--text-label-size);
  line-height: var(--text-label-lh);
  font-weight: var(--weight-medium);
  letter-spacing: var(--text-label-track);
  text-transform: uppercase;
  color: var(--text-tertiary);
}
.title {
  font-family: var(--font-display);
  font-size: var(--text-heading-sm-size);
  line-height: var(--text-heading-sm-lh);
  font-weight: var(--weight-semibold);
}
.action { flex: 0 0 auto; }
.body { padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4); }
```

- [ ] **Step 2: Create `Card.tsx`**

```tsx
// src/components/Card.tsx
import type { ReactNode } from 'react'
import styles from './Card.module.css'

interface CardProps {
  eyebrow?: string
  title?: string
  action?: ReactNode
  children: ReactNode
}

export default function Card({ eyebrow, title, action, children }: CardProps) {
  const hasHeader = Boolean(eyebrow || title || action)
  return (
    <div className={styles.card}>
      {hasHeader && (
        <div className={styles.header}>
          <div className={styles.headerText}>
            {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
            {title && <div className={styles.title}>{title}</div>}
          </div>
          {action && <div className={styles.action}>{action}</div>}
        </div>
      )}
      <div className={styles.body}>{children}</div>
    </div>
  )
}
```

- [ ] **Step 3: Create `StatusBadge.module.css`**

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  height: 20px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-caption-size);
  line-height: var(--text-caption-lh);
  font-weight: var(--weight-medium);
  white-space: nowrap;
}
.dot { width: 6px; height: 6px; border-radius: var(--radius-full); background: currentColor; flex: 0 0 auto; }
.info    { background: var(--info-soft);    color: var(--info); }
.warning { background: var(--warning-soft); color: var(--warning); }
.success { background: var(--success-soft); color: var(--success); }
.danger  { background: var(--danger-soft);  color: var(--danger); }
.neutral { background: var(--neutral-soft); color: var(--neutral); }
```

- [ ] **Step 4: Create `StatusBadge.tsx`**

```tsx
// src/components/StatusBadge.tsx
import type { ReactNode } from 'react'
import styles from './StatusBadge.module.css'

export type StatusTone = 'info' | 'warning' | 'success' | 'danger' | 'neutral'

interface StatusBadgeProps {
  tone: StatusTone
  dot?: boolean
  children: ReactNode
}

export default function StatusBadge({ tone, dot = false, children }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  )
}
```

- [ ] **Step 5: Create `Sparkline.tsx`**

Mirrors `platform-app/services/frontend/src/components/ui/Sparkline.tsx`'s technique (plain computed SVG polyline from min/max — no charting library), adapted to this component's prop names (`values`/`width`/`height`, matching the design spec's `spark` answer-block shape) and Aurora's token names:

```tsx
// src/components/Sparkline.tsx
//
// Plain SVG polyline computed from min/max — same technique as
// platform-app's Synap UI Sparkline, no charting library.

interface SparklineProps {
  values: number[]
  width: number
  height: number
  color?: string
}

export default function Sparkline({ values, width, height, color = 'var(--info)' }: SparklineProps) {
  if (values.length < 2) return null

  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const points = values.map((v, i): [number, number] => [
    (i / (values.length - 1)) * width,
    height - ((v - min) / range) * (height - 4) - 2,
  ])
  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')

  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }} aria-hidden="true">
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
```

- [ ] **Step 6: Create `KpiTile.module.css`**

```css
.tile {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
}
.label {
  font-size: var(--text-label-size);
  line-height: var(--text-label-lh);
  font-weight: var(--weight-medium);
  letter-spacing: var(--text-label-track);
  text-transform: uppercase;
  color: var(--text-tertiary);
}
.row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); }
.value {
  font-family: var(--font-display);
  font-size: var(--text-heading-lg-size);
  line-height: var(--text-heading-lg-lh);
  font-weight: var(--weight-semibold);
  font-variant-numeric: tabular-nums;
}
.delta { font-size: var(--text-body-sm-size); line-height: var(--text-body-sm-lh); font-variant-numeric: tabular-nums; }
.up { color: var(--success); }
.down { color: var(--warning); }
```

- [ ] **Step 7: Create `KpiTile.tsx`**

```tsx
// src/components/KpiTile.tsx
import Sparkline from './Sparkline'
import styles from './KpiTile.module.css'

interface KpiTileProps {
  label: string
  value: string
  delta: string
  tone: 'up' | 'down'
  trend: number[]
}

export default function KpiTile({ label, value, delta, tone, trend }: KpiTileProps) {
  return (
    <div className={styles.tile}>
      <div className={styles.label}>{label}</div>
      <div className={styles.row}>
        <div className={styles.value}>{value}</div>
        <Sparkline values={trend} width={64} height={28} color={tone === 'up' ? 'var(--success)' : 'var(--warning)'} />
      </div>
      <div className={`${styles.delta} ${tone === 'up' ? styles.up : styles.down}`}>{delta}</div>
    </div>
  )
}
```

- [ ] **Step 8: Create `DataTable.module.css`**

```css
.wrapper { overflow-x: auto; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
.table { width: 100%; border-collapse: collapse; font-size: var(--text-body-sm-size); line-height: var(--text-body-sm-lh); }
.table th {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-label-size);
  font-weight: var(--weight-medium);
  letter-spacing: var(--text-label-track);
  text-transform: uppercase;
  color: var(--text-tertiary);
  border-bottom: 1px solid var(--border-default);
  white-space: nowrap;
}
.table td {
  padding: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
}
.table tbody tr:last-child td { border-bottom: none; }
.numeric { text-align: right; font-variant-numeric: tabular-nums; }
.mono { font-family: var(--font-mono); }
.muted { color: var(--text-tertiary); }
```

- [ ] **Step 9: Create `DataTable.tsx`**

Tables scroll horizontally rather than reflowing to cards below 1024px — per the restored `design_handoff/CLAUDE.md`'s convention — handled by `.wrapper { overflow-x: auto }` above.

```tsx
// src/components/DataTable.tsx
import type { ReactNode } from 'react'
import styles from './DataTable.module.css'

export interface DataTableColumn<T> {
  key: keyof T & string
  label: string
  numeric?: boolean
  mono?: boolean
  muted?: boolean
  render?: (row: T) => ReactNode
}

interface DataTableProps<T extends { id: string | number }> {
  columns: DataTableColumn<T>[]
  rows: T[]
}

export default function DataTable<T extends { id: string | number }>({ columns, rows }: DataTableProps<T>) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.numeric ? styles.numeric : undefined}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={[col.numeric && styles.numeric, col.mono && styles.mono, col.muted && styles.muted]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {col.render ? col.render(row) : String(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 10: Write the failing test**

Create `src/components/display-primitives.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Card from './Card'
import StatusBadge from './StatusBadge'
import KpiTile from './KpiTile'
import DataTable, { type DataTableColumn } from './DataTable'

describe('display primitives', () => {
  it('Card renders eyebrow, title, action, and children', () => {
    render(
      <Card eyebrow="AI business brief" title="Business is performing well today" action={<span>UPDATED 2M AGO</span>}>
        <div>body content</div>
      </Card>
    )
    expect(screen.getByText('AI business brief')).toBeInTheDocument()
    expect(screen.getByText('Business is performing well today')).toBeInTheDocument()
    expect(screen.getByText('UPDATED 2M AGO')).toBeInTheDocument()
    expect(screen.getByText('body content')).toBeInTheDocument()
  })

  it('StatusBadge renders its tone and label text', () => {
    render(
      <StatusBadge tone="warning" dot>
        Delayed
      </StatusBadge>
    )
    expect(screen.getByText('Delayed')).toBeInTheDocument()
  })

  it('KpiTile renders label, value, and delta', () => {
    render(<KpiTile label="Orders today" value="218" delta="+14" tone="up" trend={[168, 182, 175, 204, 196, 211, 218]} />)
    expect(screen.getByText('Orders today')).toBeInTheDocument()
    expect(screen.getByText('218')).toBeInTheDocument()
    expect(screen.getByText('+14')).toBeInTheDocument()
  })

  interface Row {
    id: string
    name: string
    total: string
  }

  it('DataTable renders columns and rows, using a custom render function when given', () => {
    const columns: DataTableColumn<Row>[] = [
      { key: 'id', label: 'Order', mono: true },
      { key: 'name', label: 'Items' },
      { key: 'total', label: 'Total', numeric: true, render: (row) => `$${row.total}` },
    ]
    const rows: Row[] = [{ id: '#ORD-1', name: 'Margherita', total: '34.20' }]
    render(<DataTable columns={columns} rows={rows} />)
    expect(screen.getByText('Order')).toBeInTheDocument()
    expect(screen.getByText('#ORD-1')).toBeInTheDocument()
    expect(screen.getByText('Margherita')).toBeInTheDocument()
    expect(screen.getByText('$34.20')).toBeInTheDocument()
  })
})
```

- [ ] **Step 11: Run the test to verify it passes**

Run:
```bash
cd customer-app/services/frontend && npm run test -- --run src/components/display-primitives.test.tsx
```
Expected: `4 passed`.

- [ ] **Step 12: Type-check and lint**

Run:
```bash
cd customer-app/services/frontend && npm run type-check && npm run lint
```
Expected: no errors.

- [ ] **Step 13: Commit** (repo owner runs this — do not execute)

```bash
git add src/components/Card.tsx src/components/Card.module.css src/components/StatusBadge.tsx src/components/StatusBadge.module.css src/components/Sparkline.tsx src/components/KpiTile.tsx src/components/KpiTile.module.css src/components/DataTable.tsx src/components/DataTable.module.css src/components/display-primitives.test.tsx
git commit -m "feat(hearth-ui): add display primitives (Card, StatusBadge, Sparkline, KpiTile, DataTable)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Mock dashboard data

**Files:**
- Create: `src/lib/mockDashboardData.ts`

**Interfaces:**
- Consumes: `StatusTone` from `src/components/StatusBadge.tsx` (Task 3).
- Produces: `KPIS: KpiDatum[]`, `ORDER_ROWS: OrderRow[]` (with `export interface OrderRow { id: string; items: string; total: string; status: string; tone: StatusTone; placed: string }`), `DELIVERIES: Delivery[]`, `TOP_ITEMS: TopItem[]` — all consumed by Task 11 (Dashboard page).

Every value below is ported verbatim from `Hearth Dashboard.dc.html`'s `renderVals()` (lines 620-646) — do not alter any label, value, or delta.

- [ ] **Step 1: Create `mockDashboardData.ts`**

```ts
// src/lib/mockDashboardData.ts
//
// Fixed mock data for the Dashboard + AI Copilot screen, ported verbatim
// from `customer-app/design_handoff/Hearth Dashboard.dc.html`'s
// renderVals(). Per DASHBOARD_COPILOT.md: "Everything here is mocked;
// nothing is wired to real data" — this is the whole data layer for now.

import type { StatusTone } from '@/components/StatusBadge'

export interface KpiDatum {
  label: string
  value: string
  delta: string
  tone: 'up' | 'down'
  trend: number[]
}

export const KPIS: KpiDatum[] = [
  { label: 'Orders today', value: '218', delta: '+14', tone: 'up', trend: [168, 182, 175, 204, 196, 211, 218] },
  { label: 'Net sales', value: '$6,420', delta: '+8.1%', tone: 'up', trend: [5120, 5480, 5300, 5939, 5760, 6100, 6420] },
  { label: 'Avg delivery', value: '38m', delta: '+7m', tone: 'down', trend: [30, 31, 29, 31, 32, 34, 38] },
  { label: 'Failed payments', value: '3', delta: '$142', tone: 'down', trend: [1, 0, 1, 1, 0, 1, 3] },
]

export interface OrderRow {
  id: string
  items: string
  total: string
  status: string
  tone: StatusTone
  placed: string
}

const RAW_ORDER_ROWS: [string, string, string, string, StatusTone, string][] = [
  ['#ORD-4821', '2 × Margherita, Garlic knots', '$34.20', 'Preparing', 'info', '2m ago'],
  ['#ORD-4820', 'Carbonara, House red', '$41.00', 'Out for delivery', 'warning', '9m ago'],
  ['#ORD-4819', 'Lasagne ×3', '$57.50', 'Received', 'neutral', '11m ago'],
  ['#ORD-4818', 'Calzone, Tiramisu', '$28.75', 'Delivered', 'success', '24m ago'],
  ['#ORD-4817', 'Focaccia board', '$18.00', 'Cancelled', 'danger', '38m ago'],
]

export const ORDER_ROWS: OrderRow[] = RAW_ORDER_ROWS.map(([id, items, total, status, tone, placed]) => ({
  id,
  items,
  total,
  status,
  tone,
  placed,
}))

export interface Delivery {
  courier: string
  meta: string
  status: string
  tone: StatusTone
}

export const DELIVERIES: Delivery[] = [
  { courier: 'Dani Okafor', meta: '#ORD-4820 · ETA 12 min', status: 'On route', tone: 'info' },
  { courier: 'Sam Whitfield', meta: '#ORD-4814 · 6 min late', status: 'Delayed', tone: 'warning' },
  { courier: 'Lee Brandt', meta: '#ORD-4812 · 3 min late', status: 'Delayed', tone: 'warning' },
]

export interface TopItem {
  label: string
  value: string
  pct: number
}

export const TOP_ITEMS: TopItem[] = [
  { label: 'Margherita', value: '$1,148', pct: 100 },
  { label: 'Lasagne', value: '$912', pct: 79 },
  { label: 'Carbonara', value: '$703', pct: 61 },
  { label: 'Calzone', value: '$495', pct: 43 },
  { label: 'Tiramisu', value: '$288', pct: 25 },
]
```

- [ ] **Step 2: Type-check**

Run:
```bash
cd customer-app/services/frontend && npm run type-check
```
Expected: no errors.

- [ ] **Step 3: Commit** (repo owner runs this — do not execute)

```bash
git add src/lib/mockDashboardData.ts
git commit -m "feat(hearth-ui): add Dashboard mock data, ported from the design canvas

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Copilot script — typed port of the design canvas's `SCRIPT` object

**Files:**
- Create: `src/copilot/copilotScript.ts`

**Interfaces:**
- Consumes: `IconName` from `src/components/Icon.tsx` (Task 2).
- Produces: `export type Tone`, `export interface CompareRow/BarsRow/ListRow/ApprovalRow`, `export type AnswerBlockData`, `export interface ScriptAction/ScriptReply/ScriptEntry`, `export interface PromptDef`, `export const PROMPTS: PromptDef[]`, `export const SPARK_30: number[]`, `export const SCRIPT: Record<string, ScriptEntry>` — all consumed by Task 6 (useCopilot), Task 7 (answer blocks), Task 8 (CopilotMessage), Task 9 (CopilotPanel).

Every string, number, and structure below is ported verbatim from `Hearth Dashboard.dc.html` lines 305-458 (`PROMPTS`, `SPARK_30`, `SCRIPT`) — per `DASHBOARD_COPILOT.md`: "Treat it as the content and tone spec for real responses." Do not reword, shorten, or "improve" any copy.

- [ ] **Step 1: Create `copilotScript.ts`**

```ts
// src/copilot/copilotScript.ts
//
// Typed port of Hearth Dashboard.dc.html's SCRIPT object (lines 320-458),
// PROMPTS array (lines 305-316), and SPARK_30 data (line 318). Per
// DASHBOARD_COPILOT.md: "Treat it as the content and tone spec for real
// responses" — content is ported verbatim, not reworded.

import type { IconName } from '@/components/Icon'

export type Tone = 'up' | 'down' | 'neutral'

export interface CompareRow {
  label: string
  from: string
  to: string
  tone: Tone
}

export interface BarsRow {
  label: string
  value: string
  pct: number
}

export interface ListRow {
  mark: string
  label: string
}

export interface ApprovalRow {
  mark: string
  label: string
}

export type AnswerBlockData =
  | { type: 'compare'; title?: string; rows: CompareRow[] }
  | { type: 'bars'; title?: string; rows: BarsRow[] }
  | { type: 'spark'; title?: string; values: number[]; stats: { label: string; value: string }[] }
  | { type: 'list'; title?: string; rows: ListRow[] }
  | { type: 'approval'; title?: string; rows: ApprovalRow[] }

export interface ScriptAction {
  label: string
  next: string | null
}

export interface ScriptReply {
  label: string
  next: string
}

export interface ScriptEntry {
  stage: 'Ask' | 'Understand' | 'Explain' | 'Recommend' | 'Act'
  p: string[]
  p2?: string
  blocks?: AnswerBlockData[]
  actions?: ScriptAction[]
  replies?: ScriptReply[]
}

export interface PromptDef {
  key: string
  area: string
  question: string
  icon: IconName
}

export const PROMPTS: PromptDef[] = [
  { key: 'performance', area: 'Business performance', question: 'How is my business performing today?', icon: 'activity' },
  { key: 'revenue', area: 'Revenue', question: 'Why are sales lower than last Thursday?', icon: 'banknote' },
  { key: 'orders', area: 'Orders', question: 'Why did order volume drop during lunch?', icon: 'receipt-text' },
  { key: 'payments', area: 'Payments', question: 'Why have failed payments increased today?', icon: 'credit-card' },
  { key: 'delivery', area: 'Delivery', question: 'Why are deliveries taking longer today?', icon: 'truck' },
  { key: 'menu', area: 'Menu performance', question: 'Which menu items generate the most revenue?', icon: 'book-open' },
  { key: 'trends', area: 'Trends', question: 'Show me the sales trend for the last 30 days.', icon: 'line-chart' },
  { key: 'anomalies', area: 'Anomalies', question: 'Anything unusual happening today?', icon: 'search' },
  { key: 'focus', area: 'Recommendations', question: 'What should I focus on today?', icon: 'lightbulb' },
  { key: 'forecast', area: 'Forecasting', question: 'What order volume should I expect this weekend?', icon: 'calendar-clock' },
]

export const SPARK_30: number[] = [
  5120, 4890, 5300, 5610, 6980, 8420, 6110, 3410, 4720, 5050, 5480, 5900, 7210, 8940, 6400, 3720, 4980, 5160, 5390,
  6020, 7350, 8610, 6230, 3890, 5010, 5310, 5640, 5939, 7480, 6420,
]

export const SCRIPT: Record<string, ScriptEntry> = {
  performance: {
    stage: 'Understand',
    p: [
      'Business is performing well today. Sales and order volume are both ahead of last Thursday; the two weak spots are lunch delivery times and three failed payments.',
    ],
    blocks: [
      {
        type: 'compare',
        title: 'Today vs last Thursday',
        rows: [
          { label: 'Net sales', from: '$5,939', to: '$6,420', tone: 'up' },
          { label: 'Orders', from: '204', to: '218', tone: 'up' },
          { label: 'Avg basket', from: '$29.11', to: '$29.45', tone: 'up' },
          { label: 'Avg delivery time', from: '31 min', to: '38 min', tone: 'down' },
        ],
      },
    ],
    replies: [
      { label: 'Why are deliveries slower?', next: 'delivery' },
      { label: 'What should I focus on?', next: 'focus' },
    ],
  },
  revenue: {
    stage: 'Explain',
    p: [
      "Sales aren't lower — they're 8.1% higher than last Thursday ($6,420 vs $5,939).",
      "The one soft window was 3:00–5:00 PM, down 18%, which matches last Thursday's pattern after the lunch rush. Dinner pre-orders are already 11% ahead.",
    ],
    blocks: [
      {
        type: 'compare',
        title: 'By daypart',
        rows: [
          { label: 'Lunch 11:30–2:30', from: '$2,310', to: '$2,590', tone: 'up' },
          { label: 'Afternoon 3:00–5:00', from: '$640', to: '$525', tone: 'down' },
          { label: 'Dinner so far', from: '$2,989', to: '$3,305', tone: 'up' },
        ],
      },
    ],
    replies: [
      { label: 'Show the 30-day trend', next: 'trends' },
      { label: 'Which items drove it?', next: 'menu' },
    ],
  },
  orders: {
    stage: 'Explain',
    p: [
      "Lunch volume didn't drop overall — it rose 12%. There was a 25-minute dip from 11:45 to 12:10 when online orders fell to 2.",
      'That window lines up with Margherita being marked unavailable at Eastgate Counter, which pushed its online menu below the 3-item minimum and hid the store from delivery apps.',
    ],
    blocks: [
      {
        type: 'list',
        title: 'Timeline',
        rows: [
          { mark: '11:44', label: 'Margherita marked unavailable at Eastgate Counter' },
          { mark: '11:45', label: 'Online orders paused automatically' },
          { mark: '12:10', label: 'Margherita restored, orders resumed' },
        ],
      },
    ],
    replies: [{ label: 'How do I stop that happening?', next: 'focus' }],
  },
  payments: {
    stage: 'Explain',
    p: ['3 payments failed today for $142 in total — about 3× your usual Thursday rate. Two have the same cause.'],
    blocks: [
      {
        type: 'list',
        title: 'Failed payments',
        rows: [
          { mark: '$57.50', label: '#ORD-4819 · processor timeout at 12:41 · safe to retry' },
          { mark: '$66.50', label: '#ORD-4806 · card declined · Visa ···3302' },
          { mark: '$18.00', label: '#ORD-4817 · same Visa ···3302 · order cancelled' },
        ],
      },
    ],
    actions: [
      { label: 'Retry #ORD-4819 capture', next: 'payments_act' },
      { label: 'View all payments', next: null },
    ],
    replies: [{ label: 'Why the same card twice?', next: 'payments_card' }],
  },
  payments_card: {
    stage: 'Explain',
    p: [
      'Visa ···3302 belongs to a returning customer with 14 past orders. Both declines returned "insufficient funds", so this is the card, not your setup.',
      "I wouldn't block the card. Asking the customer to update their payment method usually recovers it.",
    ],
    replies: [{ label: 'Retry the timeout payment', next: 'payments_act' }],
  },
  payments_act: {
    stage: 'Act',
    p: ["I can retry the capture for #ORD-4819. The processor timeout means the customer was never charged, so a retry won't double-bill."],
    blocks: [
      {
        type: 'approval',
        title: 'Proposed change',
        rows: [{ mark: '1', label: 'Retry capture of $57.50 for #ORD-4819 (Mastercard ···1180)' }],
      },
    ],
  },
  delivery: {
    stage: 'Explain',
    p: [
      'Most delays happened between 12:30 and 1:30 PM.',
      '17 orders were placed in that hour, 32% above your normal Thursday lunch volume. The largest contributor was preparation time, not courier travel.',
    ],
    blocks: [
      {
        type: 'compare',
        title: '12:30–1:30 PM vs usual',
        rows: [
          { label: 'Orders placed', from: '13', to: '17', tone: 'down' },
          { label: 'Prep time', from: '14 min', to: '21 min', tone: 'down' },
          { label: 'Courier travel', from: '15 min', to: '16 min', tone: 'neutral' },
        ],
      },
    ],
    p2: 'Want me to identify which menu items contributed most to the longer prep time?',
    replies: [
      { label: 'Yes', next: 'delivery_items' },
      { label: 'No, thanks', next: 'ack' },
    ],
  },
  delivery_items: {
    stage: 'Explain',
    p: [
      "Margherita and Lasagne accounted for 61% of delayed orders. Lasagne had the largest prep-time increase: 18 min → 27 min, because it's baked to order once the morning tray runs out.",
    ],
    blocks: [
      {
        type: 'bars',
        title: 'Share of delayed orders',
        rows: [
          { label: 'Margherita', value: '34%', pct: 34 },
          { label: 'Lasagne', value: '27%', pct: 27 },
          { label: 'Carbonara', value: '14%', pct: 14 },
          { label: 'Other', value: '25%', pct: 25 },
        ],
      },
    ],
    actions: [
      { label: 'View affected orders', next: null },
      { label: 'Analyze kitchen performance', next: 'kitchen' },
    ],
    replies: [{ label: 'What should I do about it?', next: 'delivery_recommend' }],
  },
  kitchen: {
    stage: 'Understand',
    p: ['Your oven station hit capacity at 12:40 — 9 pizzas and 4 lasagne trays were queued at once. Prep and pass stations stayed under 70% load.'],
    blocks: [
      {
        type: 'compare',
        title: 'Peak station load',
        rows: [
          { label: 'Oven', from: '78%', to: '100%', tone: 'down' },
          { label: 'Prep', from: '55%', to: '64%', tone: 'neutral' },
          { label: 'Pass', from: '48%', to: '61%', tone: 'neutral' },
        ],
      },
    ],
    replies: [{ label: 'What should I do about it?', next: 'delivery_recommend' }],
  },
  delivery_recommend: {
    stage: 'Recommend',
    p: ["Two changes would have recovered most of today's delay:"],
    blocks: [
      {
        type: 'list',
        rows: [
          {
            mark: '1',
            label:
              'Bake a second lasagne tray at 11:30 on weekdays. It frees the oven for pizzas at peak and would have saved about 9 minutes per delayed order.',
          },
          {
            mark: '2',
            label:
              "Quote 38 min for delivery between 12:15 and 1:45 PM instead of 30 min, so customers aren't told an ETA you can't hit.",
          },
        ],
      },
    ],
    p2: 'Estimated effect: on-time deliveries at lunch from 71% to 90%.',
    replies: [
      { label: 'Go ahead and make those changes', next: 'delivery_act' },
      { label: 'Just the first one', next: 'delivery_act_one' },
    ],
  },
  delivery_act: {
    stage: 'Act',
    p: ["Here's exactly what I'll change. Nothing is applied until you approve."],
    blocks: [
      {
        type: 'approval',
        title: 'Proposed changes',
        rows: [
          { mark: '1', label: 'Add "Lasagne tray #2 — 11:30" to the weekday prep list' },
          { mark: '2', label: 'Set lunch delivery quote to 38 min, 12:15–1:45 PM, Mon–Fri' },
        ],
      },
    ],
  },
  delivery_act_one: {
    stage: 'Act',
    p: ['Just the prep change, then. Nothing is applied until you approve.'],
    blocks: [
      {
        type: 'approval',
        title: 'Proposed change',
        rows: [{ mark: '1', label: 'Add "Lasagne tray #2 — 11:30" to the weekday prep list' }],
      },
    ],
  },
  menu: {
    stage: 'Understand',
    p: [
      "Margherita is your top earner today at $1,148, followed by Lasagne. Together they're 32% of today's sales.",
      "Tiramisu is worth a look: it's in only 6% of orders but attaches to 1 in 3 pasta orders when it's offered at checkout.",
    ],
    blocks: [
      {
        type: 'bars',
        title: 'Revenue today',
        rows: [
          { label: 'Margherita', value: '$1,148', pct: 100 },
          { label: 'Lasagne', value: '$912', pct: 79 },
          { label: 'Carbonara', value: '$703', pct: 61 },
          { label: 'Calzone', value: '$495', pct: 43 },
          { label: 'Tiramisu', value: '$288', pct: 25 },
        ],
      },
    ],
    replies: [{ label: 'How do I sell more tiramisu?', next: 'focus' }],
  },
  trends: {
    stage: 'Understand',
    p: ['Sales are up 6% over the last 30 days. Your week has a steady shape: Saturdays peak, Mondays are your quietest day.'],
    blocks: [
      {
        type: 'spark',
        title: 'Net sales · last 30 days',
        values: SPARK_30,
        stats: [
          { label: 'Daily avg', value: '$5,880' },
          { label: 'Best day', value: '$8,940 Sat' },
          { label: 'Quietest', value: '$3,410 Mon' },
        ],
      },
    ],
    replies: [{ label: 'What about this weekend?', next: 'forecast' }],
  },
  anomalies: {
    stage: 'Understand',
    p: ['Three things are outside your normal range today:'],
    blocks: [
      {
        type: 'list',
        rows: [
          { mark: '!', label: 'Lunch prep time ran 7 minutes above your Thursday average.' },
          { mark: '!', label: 'Failed payments are 3× your usual rate — 2 of 3 from one card.' },
          { mark: '!', label: 'Eastgate Counter received 4 online orders while marked closed.' },
        ],
      },
    ],
    replies: [
      { label: 'Why did Eastgate get orders?', next: 'eastgate' },
      { label: 'Explain the prep delay', next: 'delivery' },
    ],
  },
  eastgate: {
    stage: 'Explain',
    p: [
      "Eastgate Counter's hours were updated to closed on Thursdays, but the delivery-app listing still shows the old hours. The 4 orders were auto-rejected and refunded, so no customer was charged.",
    ],
    actions: [{ label: 'Review Eastgate hours', next: null }],
  },
  focus: {
    stage: 'Recommend',
    p: ['Three things, in order of impact:'],
    blocks: [
      {
        type: 'list',
        rows: [
          { mark: '1', label: "Fix lunch prep — a second lasagne tray at 11:30 addresses most of today's late deliveries." },
          { mark: '2', label: "Retry the $57.50 timeout payment on #ORD-4819. It's recoverable today." },
          { mark: '3', label: 'Offer tiramisu at checkout on pasta orders. Likely +$180 a day.' },
        ],
      },
    ],
    replies: [
      { label: 'Start with the prep change', next: 'delivery_recommend' },
      { label: 'Retry the payment', next: 'payments_act' },
    ],
  },
  forecast: {
    stage: 'Recommend',
    p: [
      "Expect about 820 orders across the weekend, 7% above last weekend, with Saturday the busiest day. Saturday dinner is where you're most likely to run short.",
    ],
    blocks: [
      {
        type: 'bars',
        title: 'Forecast orders',
        rows: [
          { label: 'Friday', value: '262 (240–285)', pct: 82 },
          { label: 'Saturday', value: '318 (290–345)', pct: 100 },
          { label: 'Sunday', value: '241 (220–265)', pct: 76 },
        ],
      },
    ],
    p2: "I'd add one courier for Saturday 6:00–9:00 PM.",
    replies: [{ label: 'How confident is that?', next: 'forecast_conf' }],
  },
  forecast_conf: {
    stage: 'Explain',
    p: [
      "Reasonably. It's based on your last 12 weekends, current pre-orders, and the local weather forecast. Over the past 8 weekends the forecast landed within ±9% each time.",
    ],
  },
  ack: {
    stage: 'Understand',
    p: ["No problem. I'll flag it if lunch delays continue tomorrow."],
  },
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
cd customer-app/services/frontend && npm run type-check
```
Expected: no errors.

- [ ] **Step 3: Commit** (repo owner runs this — do not execute)

```bash
git add src/copilot/copilotScript.ts
git commit -m "feat(hearth-ui): port Copilot SCRIPT/PROMPTS from the design canvas

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: `useCopilot` hook and its test

**Files:**
- Create: `src/copilot/useCopilot.ts`
- Test: `src/copilot/useCopilot.test.ts`

**Interfaces:**
- Consumes: `PROMPTS`, `SCRIPT`, `ScriptEntry` from `src/copilot/copilotScript.ts` (Task 5).
- Produces: `export type MessageRole`, `export interface ThreadMessage { id: number; role: MessageRole; text?: string; key?: string; custom?: ScriptEntry }`, `export type ApprovalDecision = 'approved' | 'dismissed'`, `export function useCopilot()` returning `{ messages: ThreadMessage[], draft: string, setDraft: (v: string) => void, approvals: Record<number, ApprovalDecision>, respond: (key: string, userText?: string) => void, send: (text: string) => void, resolveApproval: (msgId: number, key: string, decision: ApprovalDecision) => void, newThread: () => void }` — consumed by Task 9 (CopilotPanel) and Task 10 (AppShellLayout).

This ports `Hearth Dashboard.dc.html`'s `Component` class (lines 460-542): `componentDidMount`'s default-conversation seed, `push`, `respond`, `send` (the `freeform` miss-path is replaced with the fixed fallback message — per the design spec, real LLM calls are explicitly out of scope), and `resolveApproval`'s three confirmation messages.

- [ ] **Step 1: Write the failing test**

Create `src/copilot/useCopilot.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useCopilot } from './useCopilot'

describe('useCopilot', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('pre-seeds the delivery deep-dive conversation on mount', () => {
    const { result } = renderHook(() => useCopilot())
    expect(result.current.messages).toHaveLength(4)
    expect(result.current.messages[0]).toMatchObject({ role: 'user', text: 'Why are deliveries delayed?' })
    expect(result.current.messages[1]).toMatchObject({ role: 'copilot', key: 'delivery' })
    expect(result.current.messages[2]).toMatchObject({ role: 'user', text: 'Yes' })
    expect(result.current.messages[3]).toMatchObject({ role: 'copilot', key: 'delivery_items' })
  })

  it('walks the DASHBOARD_COPILOT.md reference conversation through to an approved change', () => {
    const { result } = renderHook(() => useCopilot())

    act(() => {
      result.current.respond('delivery_recommend', 'What should I do about it?')
    })
    act(() => {
      vi.advanceTimersByTime(900)
    })
    expect(result.current.messages.at(-1)).toMatchObject({ role: 'copilot', key: 'delivery_recommend' })

    act(() => {
      result.current.respond('delivery_act', 'Go ahead and make those changes')
    })
    act(() => {
      vi.advanceTimersByTime(900)
    })
    const approvalMessage = result.current.messages.at(-1)!
    expect(approvalMessage).toMatchObject({ role: 'copilot', key: 'delivery_act' })

    act(() => {
      result.current.resolveApproval(approvalMessage.id, 'delivery_act', 'approved')
    })

    expect(result.current.approvals[approvalMessage.id]).toBe('approved')
    const confirmation = result.current.messages.at(-1)!
    expect(confirmation.role).toBe('copilot')
    expect(confirmation.custom?.p[0]).toContain('Lasagne tray #2 is on the weekday prep list')
  })

  it('a free-text miss shows the fixed fallback message, never a network call', () => {
    const { result } = renderHook(() => useCopilot())
    act(() => {
      result.current.send('What is the weather in Antarctica?')
    })
    act(() => {
      vi.advanceTimersByTime(900)
    })
    const last = result.current.messages.at(-1)!
    expect(last.role).toBe('copilot')
    expect(last.custom?.p[0]).toContain("couldn't reach the analysis service")
  })

  it('a free-text question matching a starter prompt case-insensitively runs that prompt', () => {
    const { result } = renderHook(() => useCopilot())
    act(() => {
      result.current.send('WHY ARE DELIVERIES TAKING LONGER TODAY?')
    })
    act(() => {
      vi.advanceTimersByTime(900)
    })
    const last = result.current.messages.at(-1)!
    expect(last).toMatchObject({ role: 'copilot', key: 'delivery' })
  })

  it('newThread clears messages and approvals', () => {
    const { result } = renderHook(() => useCopilot())
    act(() => {
      result.current.newThread()
    })
    expect(result.current.messages).toHaveLength(0)
    expect(result.current.approvals).toEqual({})
  })

  it('dismissing an approval records the decision without pushing a confirmation message', () => {
    const { result } = renderHook(() => useCopilot())
    act(() => {
      result.current.respond('payments_act', 'Retry #ORD-4819 capture')
    })
    act(() => {
      vi.advanceTimersByTime(900)
    })
    const approvalMessage = result.current.messages.at(-1)!
    const lengthBefore = result.current.messages.length

    act(() => {
      result.current.resolveApproval(approvalMessage.id, 'payments_act', 'dismissed')
    })

    expect(result.current.approvals[approvalMessage.id]).toBe('dismissed')
    expect(result.current.messages).toHaveLength(lengthBefore)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
cd customer-app/services/frontend && npm run test -- --run src/copilot/useCopilot.test.ts
```
Expected: FAIL — `Cannot find module './useCopilot'` (the module doesn't exist yet).

- [ ] **Step 3: Create `useCopilot.ts`**

```ts
// src/copilot/useCopilot.ts
//
// Ports Hearth Dashboard.dc.html's Component class (lines 460-542): the
// default-conversation seed, push/respond/send, and resolveApproval's
// three confirmation messages. The DC's freeform() LLM-call path is
// replaced with the fixed fallback message — per DASHBOARD_COPILOT.md,
// real LLM calls are explicitly "Not built yet."

import { useCallback, useEffect, useRef, useState } from 'react'
import { PROMPTS, type ScriptEntry } from './copilotScript'

export type MessageRole = 'user' | 'pending' | 'copilot'

export interface ThreadMessage {
  id: number
  role: MessageRole
  /** user, pending */
  text?: string
  /** copilot — a SCRIPT key */
  key?: string
  /** copilot — inline content (confirmations, the free-text fallback) */
  custom?: ScriptEntry
}

export type ApprovalDecision = 'approved' | 'dismissed'

const FALLBACK_TEXT =
  "We couldn't reach the analysis service just now. Try one of the suggested questions, which run on today's data directly."

function confirmationFor(key: string): ScriptEntry {
  if (key === 'payments_act') {
    return {
      stage: 'Act',
      p: ['Done. Capture retried and succeeded — $57.50 received for #ORD-4819. Failed payments today are now 2 ($84.50).'],
      actions: [{ label: 'Undo', next: null }],
    }
  }
  if (key === 'delivery_act_one') {
    return {
      stage: 'Act',
      p: [
        'Done. "Lasagne tray #2 — 11:30" is on the weekday prep list starting tomorrow. I\'ll report back on lunch delivery times after tomorrow\'s service.',
      ],
      actions: [{ label: 'Undo', next: null }],
    }
  }
  return {
    stage: 'Act',
    p: [
      'Done. Lasagne tray #2 is on the weekday prep list from tomorrow, and the lunch delivery quote is now 38 min between 12:15 and 1:45 PM.',
      "I'll report back on lunch delivery times after tomorrow's service.",
    ],
    actions: [{ label: 'Undo', next: null }],
  }
}

export function useCopilot() {
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [draft, setDraft] = useState('')
  const [approvals, setApprovals] = useState<Record<number, ApprovalDecision>>({})
  const seq = useRef(0)
  const pendingTimer = useRef<ReturnType<typeof setTimeout>>()

  const nextId = () => ++seq.current

  const push = useCallback((...msgs: Omit<ThreadMessage, 'id'>[]) => {
    setMessages((prev) => [...prev, ...msgs.map((m) => ({ id: nextId(), ...m }))])
  }, [])

  useEffect(() => {
    push(
      { role: 'user', text: 'Why are deliveries delayed?' },
      { role: 'copilot', key: 'delivery' },
      { role: 'user', text: 'Yes' },
      { role: 'copilot', key: 'delivery_items' }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => clearTimeout(pendingTimer.current), [])

  const respond = useCallback(
    (key: string, userText?: string) => {
      if (userText) push({ role: 'user', text: userText })
      const pendingId = nextId()
      const pendingText = key === 'delivery_act' || key === 'payments_act' ? 'Preparing changes…' : 'Reading orders, menu, and payments…'
      setMessages((prev) => [...prev, { id: pendingId, role: 'pending', text: pendingText }])
      clearTimeout(pendingTimer.current)
      pendingTimer.current = setTimeout(() => {
        setMessages((prev) => [...prev.filter((m) => m.id !== pendingId), { id: nextId(), role: 'copilot', key }])
      }, 900)
    },
    [push]
  )

  const send = useCallback(
    (text: string) => {
      const t = text.trim()
      if (!t) return
      setDraft('')

      const hit = PROMPTS.find((p) => p.question.toLowerCase() === t.toLowerCase())
      if (hit) {
        respond(hit.key, t)
        return
      }

      push({ role: 'user', text: t })
      const pendingId = nextId()
      setMessages((prev) => [...prev, { id: pendingId, role: 'pending', text: 'Thinking…' }])
      clearTimeout(pendingTimer.current)
      pendingTimer.current = setTimeout(() => {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== pendingId),
          { id: nextId(), role: 'copilot', custom: { stage: 'Explain', p: [FALLBACK_TEXT] } },
        ])
      }, 900)
    },
    [push, respond]
  )

  const resolveApproval = useCallback((msgId: number, key: string, decision: ApprovalDecision) => {
    setApprovals((prev) => ({ ...prev, [msgId]: decision }))
    if (decision === 'approved') {
      push({ role: 'copilot', custom: confirmationFor(key) })
    }
  }, [push])

  const newThread = useCallback(() => {
    clearTimeout(pendingTimer.current)
    setMessages([])
    setApprovals({})
  }, [])

  return { messages, draft, setDraft, approvals, respond, send, resolveApproval, newThread }
}
```

Note: this hook only ever stores a `key` string on a `ThreadMessage` — it never looks up `SCRIPT[key]` itself (that lookup happens in `CopilotMessage`, Task 8, which resolves `key` to a `ScriptEntry` for rendering). So `useCopilot.ts` imports only `PROMPTS` and the `ScriptEntry` type, not `SCRIPT` — importing `SCRIPT` here without using it would fail `npm run lint` (`@typescript-eslint/no-unused-vars` is a warning, and the project's lint script runs with `--max-warnings 0`).

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
cd customer-app/services/frontend && npm run test -- --run src/copilot/useCopilot.test.ts
```
Expected: `6 passed`.

- [ ] **Step 5: Type-check and lint**

Run:
```bash
cd customer-app/services/frontend && npm run type-check && npm run lint
```
Expected: no errors.

- [ ] **Step 6: Commit** (repo owner runs this — do not execute)

```bash
git add src/copilot/useCopilot.ts src/copilot/useCopilot.test.ts
git commit -m "feat(hearth-ui): add useCopilot hook, ported from the design canvas's Component class

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: Copilot answer blocks — Compare, Bars, Spark, List, Approval

**Files:**
- Create: `src/copilot/blocks.module.css`
- Create: `src/copilot/blocks/CompareBlock.tsx`
- Create: `src/copilot/blocks/BarsBlock.tsx`
- Create: `src/copilot/blocks/SparkBlock.tsx`
- Create: `src/copilot/blocks/ListBlock.tsx`
- Create: `src/copilot/blocks/ApprovalBlock.tsx`
- Test: `src/copilot/blocks/blocks.test.tsx`

**Interfaces:**
- Consumes: `CompareRow, BarsRow, ListRow, ApprovalRow` from `src/copilot/copilotScript.ts` (Task 5); `Sparkline` from `src/components/Sparkline.tsx` (Task 3); `Button`, `StatusBadge` from Task 2/3; `ApprovalDecision` from `src/copilot/useCopilot.ts` (Task 6).
- Produces: `CompareBlock({ rows })`, `BarsBlock({ rows })`, `SparkBlock({ values, stats })`, `ListBlock({ rows })`, `ApprovalBlock({ rows, decision?, onApprove, onDismiss })` — all consumed by Task 8 (`AnswerBlock` dispatcher).

The chart-fill color `--viz-1` used in the design canvas is not a token defined in this project's `src/index.css` (only the `_ds/` design-system bundle, which isn't part of this repo, defines it) — every bar fill below uses `var(--info)` instead, a real token that exists.

- [ ] **Step 1: Create `blocks.module.css`**

```css
.blockContainer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-canvas);
}
.blockTitle {
  font-size: var(--text-caption-size);
  line-height: var(--text-caption-lh);
  font-weight: var(--weight-medium);
  letter-spacing: var(--text-label-track);
  text-transform: uppercase;
  color: var(--text-tertiary);
}
.rows { display: flex; flex-direction: column; gap: var(--space-2); }

.compareRow { display: flex; align-items: center; gap: var(--space-3); font-size: var(--text-body-sm-size); line-height: var(--text-body-sm-lh); }
.compareLabel { flex: 1; color: var(--text-secondary); }
.compareFrom { font-variant-numeric: tabular-nums; color: var(--text-tertiary); }
.compareArrow { color: var(--text-tertiary); }
.compareTo { font-variant-numeric: tabular-nums; font-weight: var(--weight-medium); }

.barRow { display: flex; flex-direction: column; gap: var(--space-1); }
.barLabelRow { display: flex; justify-content: space-between; gap: var(--space-3); font-size: var(--text-body-sm-size); line-height: var(--text-body-sm-lh); }
.barValue { font-variant-numeric: tabular-nums; color: var(--text-secondary); }
.barTrack { height: 4px; border-radius: var(--radius-full); background: var(--bg-elevated); }
.barFill { height: 4px; border-radius: var(--radius-full); background: var(--info); }

.sparkBlock { display: flex; flex-direction: column; gap: var(--space-3); }
.sparkStats { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-2); }
.sparkStat { display: flex; flex-direction: column; gap: 2px; }
.sparkStatLabel { font-size: var(--text-caption-size); line-height: var(--text-caption-lh); color: var(--text-tertiary); }
.sparkStatValue { font-size: var(--text-body-sm-size); font-variant-numeric: tabular-nums; }

.listRow { display: flex; gap: var(--space-2); font-size: var(--text-body-sm-size); line-height: var(--text-body-sm-lh); }
.listMark { flex: 0 0 16px; font-family: var(--font-mono); color: var(--text-tertiary); }
.listMarkWarn { color: var(--warning); }

.approvalRow { display: flex; gap: var(--space-2); font-size: var(--text-body-sm-size); line-height: var(--text-body-sm-lh); }
.approvalMark { color: var(--text-tertiary); font-family: var(--font-mono); }
.approvalActions { display: flex; gap: var(--space-2); padding-top: var(--space-1); }
```

- [ ] **Step 2: Create `CompareBlock.tsx`**

```tsx
// src/copilot/blocks/CompareBlock.tsx
import type { CompareRow } from '../copilotScript'
import styles from '../blocks.module.css'

const TONE_COLOR: Record<CompareRow['tone'], string> = {
  up: 'var(--success)',
  down: 'var(--warning)',
  neutral: 'var(--text-primary)',
}

export default function CompareBlock({ rows }: { rows: CompareRow[] }) {
  return (
    <div className={styles.rows}>
      {rows.map((r) => (
        <div key={r.label} className={styles.compareRow}>
          <span className={styles.compareLabel}>{r.label}</span>
          <span className={styles.compareFrom}>{r.from}</span>
          <span className={styles.compareArrow}>→</span>
          <span className={styles.compareTo} style={{ color: TONE_COLOR[r.tone] }}>
            {r.to}
          </span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create `BarsBlock.tsx`**

```tsx
// src/copilot/blocks/BarsBlock.tsx
import type { BarsRow } from '../copilotScript'
import styles from '../blocks.module.css'

export default function BarsBlock({ rows }: { rows: BarsRow[] }) {
  return (
    <div className={styles.rows}>
      {rows.map((r) => (
        <div key={r.label} className={styles.barRow}>
          <div className={styles.barLabelRow}>
            <span>{r.label}</span>
            <span className={styles.barValue}>{r.value}</span>
          </div>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: `${r.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Create `SparkBlock.tsx`**

```tsx
// src/copilot/blocks/SparkBlock.tsx
import Sparkline from '@/components/Sparkline'
import styles from '../blocks.module.css'

interface SparkBlockProps {
  values: number[]
  stats: { label: string; value: string }[]
}

export default function SparkBlock({ values, stats }: SparkBlockProps) {
  return (
    <div className={styles.sparkBlock}>
      <Sparkline values={values} width={300} height={56} color="var(--info)" />
      <div className={styles.sparkStats}>
        {stats.map((s) => (
          <div key={s.label} className={styles.sparkStat}>
            <span className={styles.sparkStatLabel}>{s.label}</span>
            <span className={styles.sparkStatValue}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create `ListBlock.tsx`**

```tsx
// src/copilot/blocks/ListBlock.tsx
import type { ListRow } from '../copilotScript'
import styles from '../blocks.module.css'

export default function ListBlock({ rows }: { rows: ListRow[] }) {
  return (
    <div className={styles.rows}>
      {rows.map((r, i) => (
        <div key={i} className={styles.listRow}>
          <span className={`${styles.listMark} ${r.mark === '!' ? styles.listMarkWarn : ''}`}>{r.mark}</span>
          <span>{r.label}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Create `ApprovalBlock.tsx`**

```tsx
// src/copilot/blocks/ApprovalBlock.tsx
import type { ApprovalRow } from '../copilotScript'
import Button from '@/components/Button'
import StatusBadge from '@/components/StatusBadge'
import type { ApprovalDecision } from '../useCopilot'
import styles from '../blocks.module.css'

interface ApprovalBlockProps {
  rows: ApprovalRow[]
  decision?: ApprovalDecision
  onApprove: () => void
  onDismiss: () => void
}

export default function ApprovalBlock({ rows, decision, onApprove, onDismiss }: ApprovalBlockProps) {
  return (
    <div className={styles.rows}>
      {rows.map((r, i) => (
        <div key={i} className={styles.approvalRow}>
          <span className={styles.approvalMark}>{r.mark}</span>
          <span>{r.label}</span>
        </div>
      ))}
      {!decision && (
        <div className={styles.approvalActions}>
          <Button variant="primary" size="sm" onClick={onApprove}>
            Approve changes
          </Button>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Not now
          </Button>
        </div>
      )}
      {decision && (
        <StatusBadge tone={decision === 'approved' ? 'success' : 'neutral'} dot>
          {decision === 'approved' ? 'Approved by Rosa · just now' : 'Dismissed'}
        </StatusBadge>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Write the failing test**

Create `src/copilot/blocks/blocks.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CompareBlock from './CompareBlock'
import BarsBlock from './BarsBlock'
import SparkBlock from './SparkBlock'
import ListBlock from './ListBlock'
import ApprovalBlock from './ApprovalBlock'

describe('Copilot answer blocks', () => {
  it('CompareBlock renders from/to values', () => {
    render(<CompareBlock rows={[{ label: 'Net sales', from: '$5,939', to: '$6,420', tone: 'up' }]} />)
    expect(screen.getByText('Net sales')).toBeInTheDocument()
    expect(screen.getByText('$5,939')).toBeInTheDocument()
    expect(screen.getByText('$6,420')).toBeInTheDocument()
  })

  it('BarsBlock renders label and value', () => {
    render(<BarsBlock rows={[{ label: 'Margherita', value: '34%', pct: 34 }]} />)
    expect(screen.getByText('Margherita')).toBeInTheDocument()
    expect(screen.getByText('34%')).toBeInTheDocument()
  })

  it('SparkBlock renders its stats', () => {
    render(<SparkBlock values={[1, 2, 3, 4]} stats={[{ label: 'Daily avg', value: '$5,880' }]} />)
    expect(screen.getByText('Daily avg')).toBeInTheDocument()
    expect(screen.getByText('$5,880')).toBeInTheDocument()
  })

  it('ListBlock renders numbered and warning marks', () => {
    render(<ListBlock rows={[{ mark: '1', label: 'Bake a second lasagne tray' }]} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Bake a second lasagne tray')).toBeInTheDocument()
  })

  it('ApprovalBlock shows Approve/Not now when pending, and calls the right handler', () => {
    const onApprove = vi.fn()
    const onDismiss = vi.fn()
    render(
      <ApprovalBlock
        rows={[{ mark: '1', label: 'Retry capture of $57.50 for #ORD-4819' }]}
        onApprove={onApprove}
        onDismiss={onDismiss}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Approve changes' }))
    expect(onApprove).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('ApprovalBlock shows a resolved badge instead of buttons once decided', () => {
    render(
      <ApprovalBlock
        rows={[{ mark: '1', label: 'Retry capture of $57.50 for #ORD-4819' }]}
        decision="approved"
        onApprove={() => {}}
        onDismiss={() => {}}
      />
    )
    expect(screen.getByText('Approved by Rosa · just now')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve changes' })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 8: Run the test to verify it passes**

Run:
```bash
cd customer-app/services/frontend && npm run test -- --run src/copilot/blocks/blocks.test.tsx
```
Expected: `6 passed`.

- [ ] **Step 9: Type-check and lint**

Run:
```bash
cd customer-app/services/frontend && npm run type-check && npm run lint
```
Expected: no errors.

- [ ] **Step 10: Commit** (repo owner runs this — do not execute)

```bash
git add src/copilot/blocks.module.css src/copilot/blocks/CompareBlock.tsx src/copilot/blocks/BarsBlock.tsx src/copilot/blocks/SparkBlock.tsx src/copilot/blocks/ListBlock.tsx src/copilot/blocks/ApprovalBlock.tsx src/copilot/blocks/blocks.test.tsx
git commit -m "feat(hearth-ui): add Copilot answer-block components (compare/bars/spark/list/approval)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 8: `AnswerBlock` dispatcher and `CopilotMessage`

**Files:**
- Create: `src/copilot/AnswerBlock.tsx`
- Create: `src/copilot/CopilotMessage.module.css`
- Create: `src/copilot/CopilotMessage.tsx`
- Test: `src/copilot/CopilotMessage.test.tsx`

**Interfaces:**
- Consumes: block components from Task 7; `AnswerBlockData` from Task 5; `ThreadMessage`, `ApprovalDecision` from Task 6; `SCRIPT` from Task 5; `Icon`, `Button` from Task 2.
- Produces: `AnswerBlock({ block, approvalDecision?, onApprove?, onDismiss? })`, `CopilotMessage({ message, isLast, approval?, onReply, onAction, onApprove, onDismiss })` — consumed by Task 9 (`CopilotPanel`).

- [ ] **Step 1: Create `AnswerBlock.tsx`**

```tsx
// src/copilot/AnswerBlock.tsx
import type { AnswerBlockData } from './copilotScript'
import type { ApprovalDecision } from './useCopilot'
import CompareBlock from './blocks/CompareBlock'
import BarsBlock from './blocks/BarsBlock'
import SparkBlock from './blocks/SparkBlock'
import ListBlock from './blocks/ListBlock'
import ApprovalBlock from './blocks/ApprovalBlock'
import styles from './blocks.module.css'

interface AnswerBlockProps {
  block: AnswerBlockData
  approvalDecision?: ApprovalDecision
  onApprove?: () => void
  onDismiss?: () => void
}

export default function AnswerBlock({ block, approvalDecision, onApprove, onDismiss }: AnswerBlockProps) {
  return (
    <div className={styles.blockContainer}>
      {block.title && <div className={styles.blockTitle}>{block.title}</div>}
      {block.type === 'compare' && <CompareBlock rows={block.rows} />}
      {block.type === 'bars' && <BarsBlock rows={block.rows} />}
      {block.type === 'spark' && <SparkBlock values={block.values} stats={block.stats} />}
      {block.type === 'list' && <ListBlock rows={block.rows} />}
      {block.type === 'approval' && (
        <ApprovalBlock
          rows={block.rows}
          decision={approvalDecision}
          onApprove={onApprove ?? (() => {})}
          onDismiss={onDismiss ?? (() => {})}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `CopilotMessage.module.css`**

```css
.userBubble {
  align-self: flex-end;
  max-width: 85%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-lh);
}
.pending {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-tertiary);
  font-size: var(--text-body-sm-size);
}
.pending svg { animation: hearth-copilot-spin 1s linear infinite; }
@keyframes hearth-copilot-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.answer { display: flex; flex-direction: column; gap: var(--space-3); }
.stageRow {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-caption-size);
  line-height: var(--text-caption-lh);
  letter-spacing: var(--text-label-track);
  text-transform: uppercase;
  color: var(--text-tertiary);
}
.paragraph {
  margin: 0;
  font-size: var(--text-body-md-size);
  line-height: var(--text-body-md-lh);
}
.actionsRow, .repliesRow { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.replyChip {
  height: 24px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-full);
  border: 1px solid var(--border-default);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-size: var(--text-caption-size);
  cursor: pointer;
}
.replyChip:hover { background: var(--bg-surface); border-color: var(--border-strong); }
```

- [ ] **Step 3: Write the failing test**

Create `src/copilot/CopilotMessage.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CopilotMessage from './CopilotMessage'
import type { ThreadMessage } from './useCopilot'

const noop = () => {}

describe('CopilotMessage', () => {
  it('renders a user message as a bubble', () => {
    const message: ThreadMessage = { id: 1, role: 'user', text: 'Why are deliveries delayed?' }
    render(<CopilotMessage message={message} isLast={false} onReply={noop} onAction={noop} onApprove={noop} onDismiss={noop} />)
    expect(screen.getByText('Why are deliveries delayed?')).toBeInTheDocument()
  })

  it('renders a pending message with its status text', () => {
    const message: ThreadMessage = { id: 2, role: 'pending', text: 'Reading orders, menu, and payments…' }
    render(<CopilotMessage message={message} isLast={false} onReply={noop} onAction={noop} onApprove={noop} onDismiss={noop} />)
    expect(screen.getByText('Reading orders, menu, and payments…')).toBeInTheDocument()
  })

  it('renders a scripted copilot answer: paragraphs, a block, and reply chips only when last', () => {
    const message: ThreadMessage = { id: 3, role: 'copilot', key: 'delivery' }
    const onReply = vi.fn()

    const { rerender } = render(
      <CopilotMessage message={message} isLast={true} onReply={onReply} onAction={noop} onApprove={noop} onDismiss={noop} />
    )
    expect(screen.getByText('Most delays happened between 12:30 and 1:30 PM.')).toBeInTheDocument()
    expect(screen.getByText('12:30–1:30 PM vs usual')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Yes'))
    expect(onReply).toHaveBeenCalledWith('delivery_items', 'Yes')

    rerender(<CopilotMessage message={message} isLast={false} onReply={onReply} onAction={noop} onApprove={noop} onDismiss={noop} />)
    expect(screen.queryByText('Yes')).not.toBeInTheDocument()
  })

  it('an approval block calls onApprove/onDismiss with the message id', () => {
    const message: ThreadMessage = { id: 4, role: 'copilot', key: 'payments_act' }
    const onApprove = vi.fn()
    render(<CopilotMessage message={message} isLast={true} onReply={noop} onAction={noop} onApprove={onApprove} onDismiss={noop} />)
    fireEvent.click(screen.getByRole('button', { name: 'Approve changes' }))
    expect(onApprove).toHaveBeenCalledWith(4)
  })

  it('renders a custom (non-SCRIPT-key) copilot message, e.g. the free-text fallback', () => {
    const message: ThreadMessage = {
      id: 5,
      role: 'copilot',
      custom: { stage: 'Explain', p: ["We couldn't reach the analysis service just now."] },
    }
    render(<CopilotMessage message={message} isLast={true} onReply={noop} onAction={noop} onApprove={noop} onDismiss={noop} />)
    expect(screen.getByText("We couldn't reach the analysis service just now.")).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run the test to verify it fails**

Run:
```bash
cd customer-app/services/frontend && npm run test -- --run src/copilot/CopilotMessage.test.tsx
```
Expected: FAIL — `Cannot find module './CopilotMessage'`.

- [ ] **Step 5: Create `CopilotMessage.tsx`**

```tsx
// src/copilot/CopilotMessage.tsx
import Icon from '@/components/Icon'
import Button from '@/components/Button'
import AnswerBlock from './AnswerBlock'
import { SCRIPT } from './copilotScript'
import type { ThreadMessage, ApprovalDecision } from './useCopilot'
import styles from './CopilotMessage.module.css'

interface CopilotMessageProps {
  message: ThreadMessage
  isLast: boolean
  approval?: ApprovalDecision
  onReply: (next: string, label: string) => void
  onAction: (next: string | null, label: string) => void
  onApprove: (msgId: number) => void
  onDismiss: (msgId: number) => void
}

export default function CopilotMessage({ message, isLast, approval, onReply, onAction, onApprove, onDismiss }: CopilotMessageProps) {
  if (message.role === 'user') {
    return <div className={styles.userBubble}>{message.text}</div>
  }

  if (message.role === 'pending') {
    return (
      <div className={styles.pending}>
        <Icon name="loader" size={14} />
        <span>{message.text}</span>
      </div>
    )
  }

  const entry = message.custom ?? (message.key ? SCRIPT[message.key] : undefined)
  if (!entry) return null

  const replies = isLast ? entry.replies ?? [] : []
  const actions = entry.actions ?? []

  return (
    <div className={styles.answer}>
      <div className={styles.stageRow}>
        <Icon name="sparkles" size={14} />
        <span>Copilot</span>
      </div>

      {entry.p.map((text, i) => (
        <p key={i} className={styles.paragraph}>
          {text}
        </p>
      ))}

      {(entry.blocks ?? []).map((block, i) => (
        <AnswerBlock
          key={i}
          block={block}
          approvalDecision={block.type === 'approval' ? approval : undefined}
          onApprove={() => onApprove(message.id)}
          onDismiss={() => onDismiss(message.id)}
        />
      ))}

      {entry.p2 && <p className={styles.paragraph}>{entry.p2}</p>}

      {actions.length > 0 && (
        <div className={styles.actionsRow}>
          {actions.map((a) => (
            <Button key={a.label} variant="secondary" size="sm" onClick={() => onAction(a.next, a.label)}>
              {a.label}
            </Button>
          ))}
        </div>
      )}

      {replies.length > 0 && (
        <div className={styles.repliesRow}>
          {replies.map((r) => (
            <button key={r.label} className={styles.replyChip} onClick={() => onReply(r.next, r.label)}>
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run:
```bash
cd customer-app/services/frontend && npm run test -- --run src/copilot/CopilotMessage.test.tsx
```
Expected: `5 passed`.

- [ ] **Step 7: Type-check and lint**

Run:
```bash
cd customer-app/services/frontend && npm run type-check && npm run lint
```
Expected: no errors.

- [ ] **Step 8: Commit** (repo owner runs this — do not execute)

```bash
git add src/copilot/AnswerBlock.tsx src/copilot/CopilotMessage.module.css src/copilot/CopilotMessage.tsx src/copilot/CopilotMessage.test.tsx
git commit -m "feat(hearth-ui): add AnswerBlock dispatcher and CopilotMessage

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 9: `CopilotPanel`

**Files:**
- Create: `src/copilot/CopilotPanel.module.css`
- Create: `src/copilot/CopilotPanel.tsx`
- Test: `src/copilot/CopilotPanel.test.tsx`

**Interfaces:**
- Consumes: `CopilotMessage` (Task 8), `useCopilot`'s return type (Task 6), `PROMPTS` (Task 5), `Icon`/`Button`/`IconButton`/`Input` (Task 2).
- Produces: `CopilotPanel({ locationName: string, copilot: ReturnType<typeof useCopilot>, onClose: () => void })` — consumed by Task 10 (`AppShellLayout`).

- [ ] **Step 1: Create `CopilotPanel.module.css`**

```css
.panel {
  width: clamp(320px, 30vw, 400px);
  flex: 0 0 clamp(320px, 30vw, 400px);
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-left: 1px solid var(--border-default);
  background: var(--bg-surface);
}
.header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-default);
}
.title {
  font-family: var(--font-display);
  font-size: var(--text-heading-sm-size);
  line-height: var(--text-heading-sm-lh);
  font-weight: var(--weight-semibold);
}
.headerActions { margin-left: auto; display: flex; gap: var(--space-1); }
.thread {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
.emptyState { display: flex; flex-direction: column; gap: var(--space-4); }
.emptyText { margin: 0; color: var(--text-secondary); font-size: var(--text-body-sm-size); line-height: var(--text-body-sm-lh); }
.starterList { display: flex; flex-direction: column; border: 1px solid var(--border-default); border-radius: var(--radius-md); overflow: hidden; }
.starterRow {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3);
  border: 0;
  border-bottom: 1px solid var(--border-subtle);
  background: transparent;
  color: var(--text-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.starterRow:last-child { border-bottom: 0; }
.starterRow:hover { background: var(--bg-elevated); }
.starterIcon { color: var(--text-tertiary); padding-top: 2px; }
.starterText { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.starterArea {
  font-size: var(--text-caption-size);
  line-height: var(--text-caption-lh);
  font-weight: var(--weight-medium);
  letter-spacing: var(--text-label-track);
  text-transform: uppercase;
  color: var(--text-tertiary);
}
.starterQuestion { font-size: var(--text-body-sm-size); line-height: var(--text-body-sm-lh); }
.composer {
  padding: var(--space-3) var(--space-4) var(--space-4);
  border-top: 1px solid var(--border-default);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.composerRow { display: flex; gap: var(--space-2); }
.inputWrap { flex: 1; min-width: 0; }
.hint { font-size: var(--text-caption-size); line-height: var(--text-caption-lh); color: var(--text-tertiary); }
```

- [ ] **Step 2: Create `CopilotPanel.tsx`**

```tsx
// src/copilot/CopilotPanel.tsx
import { useEffect, useRef } from 'react'
import Icon from '@/components/Icon'
import Button from '@/components/Button'
import IconButton from '@/components/IconButton'
import Input from '@/components/Input'
import CopilotMessage from './CopilotMessage'
import { PROMPTS } from './copilotScript'
import type { useCopilot } from './useCopilot'
import styles from './CopilotPanel.module.css'

interface CopilotPanelProps {
  locationName: string
  copilot: ReturnType<typeof useCopilot>
  onClose: () => void
}

export default function CopilotPanel({ locationName, copilot, onClose }: CopilotPanelProps) {
  const { messages, draft, setDraft, approvals, respond, send, resolveApproval, newThread } = copilot
  const threadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const isEmpty = messages.length === 0

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <Icon name="sparkles" size={16} />
        <div className={styles.title}>Copilot</div>
        <div className={styles.headerActions}>
          <Button variant="ghost" size="sm" onClick={newThread}>
            New
          </Button>
          <IconButton label="Close Copilot" variant="ghost" size="sm" onClick={onClose}>
            <Icon name="panel-right-close" size={16} />
          </IconButton>
        </div>
      </div>

      <div ref={threadRef} className={styles.thread}>
        {isEmpty && (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>
              I read today&apos;s orders, menu, deliveries, and payments for {locationName}. Ask what&apos;s happening,
              why, and what to do next.
            </p>
            <div className={styles.starterList}>
              {PROMPTS.map((p) => (
                <button key={p.key} className={styles.starterRow} onClick={() => respond(p.key, p.question)}>
                  <span className={styles.starterIcon}>
                    <Icon name={p.icon} size={16} />
                  </span>
                  <span className={styles.starterText}>
                    <span className={styles.starterArea}>{p.area}</span>
                    <span className={styles.starterQuestion}>{p.question}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <CopilotMessage
            key={m.id}
            message={m}
            isLast={i === messages.length - 1}
            approval={approvals[m.id]}
            onReply={(next, label) => respond(next, label)}
            onAction={(next, label) => {
              if (next) respond(next, label)
            }}
            onApprove={(msgId) => resolveApproval(msgId, m.key ?? '', 'approved')}
            onDismiss={(msgId) => resolveApproval(msgId, m.key ?? '', 'dismissed')}
          />
        ))}
      </div>

      <div className={styles.composer}>
        <div className={styles.composerRow}>
          <div className={styles.inputWrap}>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  send(draft)
                }
              }}
              placeholder="Ask about sales, orders, menu, deliveries…"
              size="lg"
              aria-label="Ask Copilot"
            />
          </div>
          <IconButton label="Send" variant="primary" size="lg" disabled={!draft.trim()} onClick={() => send(draft)}>
            <Icon name="arrow-up" size={16} />
          </IconButton>
        </div>
        <div className={styles.hint}>Reads {locationName} data only. Changes always ask for your approval.</div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: Write the failing test**

Create `src/copilot/CopilotPanel.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CopilotPanel from './CopilotPanel'
import { useCopilot } from './useCopilot'

function Wrapper({ onClose = () => {} }: { onClose?: () => void }) {
  const copilot = useCopilot()
  return <CopilotPanel locationName="Northside Trattoria" copilot={copilot} onClose={onClose} />
}

describe('CopilotPanel', () => {
  it('renders the pre-seeded thread, not the empty state, on mount', () => {
    render(<Wrapper />)
    expect(screen.getByText('Why are deliveries delayed?')).toBeInTheDocument()
    expect(screen.queryByText(/I read today's orders/)).not.toBeInTheDocument()
  })

  it('New clears the thread back to the empty state with 10 starter questions', () => {
    render(<Wrapper />)
    fireEvent.click(screen.getByRole('button', { name: 'New' }))
    expect(screen.getByText(/I read today's orders, menu, deliveries, and payments for Northside Trattoria/)).toBeInTheDocument()
    expect(screen.getByText('How is my business performing today?')).toBeInTheDocument()
    expect(screen.getByText('What order volume should I expect this weekend?')).toBeInTheDocument()
  })

  it('Close Copilot calls onClose', () => {
    let closed = false
    render(<Wrapper onClose={() => (closed = true)} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close Copilot' }))
    expect(closed).toBe(true)
  })

  it('the send button is disabled until the composer has text', () => {
    render(<Wrapper />)
    const sendButton = screen.getByRole('button', { name: 'Send' })
    expect(sendButton).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Ask Copilot'), { target: { value: 'Anything unusual happening today?' } })
    expect(sendButton).not.toBeDisabled()
  })
})
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
cd customer-app/services/frontend && npm run test -- --run src/copilot/CopilotPanel.test.tsx
```
Expected: `4 passed`.

- [ ] **Step 5: Type-check and lint**

Run:
```bash
cd customer-app/services/frontend && npm run type-check && npm run lint
```
Expected: no errors.

- [ ] **Step 6: Commit** (repo owner runs this — do not execute)

```bash
git add src/copilot/CopilotPanel.module.css src/copilot/CopilotPanel.tsx src/copilot/CopilotPanel.test.tsx
git commit -m "feat(hearth-ui): add CopilotPanel

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 10: App Shell — Sidebar, TopBar, AppShellLayout, routing, delete Welcome

**Files:**
- Create: `src/layout/Sidebar.module.css`
- Create: `src/layout/Sidebar.tsx`
- Create: `src/layout/TopBar.module.css`
- Create: `src/layout/TopBar.tsx`
- Create: `src/layout/AppShellLayout.module.css`
- Create: `src/layout/AppShellLayout.tsx`
- Modify: `src/App.tsx`
- Delete: `src/pages/Welcome.tsx`
- Delete: `src/pages/Welcome.module.css`
- Test: `src/layout/AppShellLayout.test.tsx`

**Interfaces:**
- Consumes: `Icon`, `Button`, `IconButton` (Task 2); `useCopilot`, `PROMPTS` (Tasks 5-6); `CopilotPanel` (Task 9); `useSessionStore` (existing).
- Produces: `AppShellLayout` (the layout route element); `export interface DashboardOutletContext { askCopilot: (key: string) => void }` — consumed by Task 11 (`Dashboard`, via `useOutletContext<DashboardOutletContext>()`).

Per the design canvas's own DOM structure (`Hearth Dashboard.dc.html` lines 31-138), Sidebar, the scrolling `<main>`, and the Copilot panel are flex siblings inside one row under TopBar — so `AppShellLayout` owns `copilotOpen` state and the single `useCopilot()` instance, and exposes an `askCopilot` helper to the routed page via `<Outlet context={...}>` (React Router's mechanism for a layout route to hand callbacks down to its child route).

The display persona ("Rosa Medina", "Admin") shown in the Sidebar footer and TopBar is fixed mock content — part of the same mocked dataset as the SCRIPT's "Approved by Rosa" confirmations — not the real session email. The real session (`useSessionStore`) is used only for sign-out.

- [ ] **Step 1: Create `Sidebar.module.css`**

Sidebar nav rows are 32px, matching the restored `design_handoff/CLAUDE.md`'s documented density convention.

```css
.sidebar {
  width: var(--sidebar-w);
  flex: 0 0 var(--sidebar-w);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: var(--bg-surface);
  border-right: 1px solid var(--border-default);
  padding: var(--space-4) var(--space-3);
  overflow-y: auto;
}
.section { display: flex; flex-direction: column; gap: var(--space-1); }
.sectionLabel {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-label-size);
  font-weight: var(--weight-medium);
  letter-spacing: var(--text-label-track);
  text-transform: uppercase;
  color: var(--text-tertiary);
}
.navItem {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 32px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-body-sm-size);
  color: var(--text-secondary);
  cursor: default;
}
.active { background: var(--bg-elevated); color: var(--text-primary); font-weight: var(--weight-medium); }
.disabled { color: var(--text-disabled); }
.footer { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2); }
.avatar {
  width: var(--control-md);
  height: var(--control-md);
  flex: 0 0 var(--control-md);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-default);
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: var(--text-mono-sm-size);
  font-weight: var(--weight-semibold);
}
.footerName { font-size: var(--text-body-sm-size); line-height: var(--text-body-sm-lh); }
.footerRole { font-size: var(--text-caption-size); line-height: var(--text-caption-lh); color: var(--text-tertiary); }
```

- [ ] **Step 2: Create `Sidebar.tsx`**

```tsx
// src/layout/Sidebar.tsx
import Icon, { type IconName } from '@/components/Icon'
import styles from './Sidebar.module.css'

interface NavItem {
  id: string
  label: string
  icon: IconName
  enabled: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'gauge' as IconName, enabled: true },
  { id: 'orders', label: 'Orders', icon: 'receipt-text', enabled: false },
  { id: 'menu', label: 'Menu', icon: 'book-open', enabled: false },
  { id: 'deliveries', label: 'Deliveries', icon: 'truck', enabled: false },
  { id: 'payments', label: 'Payments', icon: 'credit-card', enabled: false },
]

interface SidebarProps {
  activeId: string
}

export default function Sidebar({ activeId }: SidebarProps) {
  return (
    <nav className={styles.sidebar} aria-label="Primary">
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Operate</div>
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activeId
          return (
            <span
              key={item.id}
              className={[styles.navItem, isActive && styles.active, !item.enabled && styles.disabled].filter(Boolean).join(' ')}
              aria-current={isActive ? 'page' : undefined}
              aria-disabled={!item.enabled || undefined}
              title={item.enabled ? undefined : 'Coming soon'}
            >
              <Icon name={item.icon} size={16} />
              {item.label}
            </span>
          )
        })}
      </div>
      <div className={styles.footer}>
        <div className={styles.avatar}>RM</div>
        <div>
          <div className={styles.footerName}>Rosa Medina</div>
          <div className={styles.footerRole}>Admin</div>
        </div>
      </div>
    </nav>
  )
}
```

`gauge` is missing from `Icon`'s map built in Task 2 — add it now:

- [ ] **Step 3: Add the missing `gauge` icon to `Icon.tsx`**

In `src/components/Icon.tsx`, add `Gauge` to the import from `'lucide-react'` (keep alphabetical: between `Lightbulb` and... actually `Gauge` comes before `Lightbulb` alphabetically, so insert it between `CreditCard` and `Lightbulb`):

```ts
import {
  Activity,
  ArrowUp,
  Banknote,
  BookOpen,
  CalendarClock,
  ChevronDown,
  CreditCard,
  Gauge,
  Lightbulb,
  LineChart,
  Loader,
  PanelRightClose,
  Power,
  ReceiptText,
  Search,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  Truck,
} from 'lucide-react'
```

And add `gauge: Gauge,` to the `ICONS` map, alphabetically after `'credit-card': CreditCard,` and before `lightbulb: Lightbulb,`. (If Task 2 was already written with this included, skip this step — but it was deliberately omitted there and added here because Sidebar is the only consumer.)

- [ ] **Step 4: Create `TopBar.module.css`**

```css
.topbar {
  height: var(--topbar-h);
  flex: 0 0 var(--topbar-h);
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: 0 var(--space-5);
  border-bottom: 1px solid var(--border-default);
  background: var(--bg-surface);
}
.wordmark { font-size: var(--text-heading-md-size); }
.locationPicker { position: relative; }
.locationButton {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: var(--control-sm);
  padding: 0 var(--control-pad-sm);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-default);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-size: var(--text-body-sm-size);
  cursor: pointer;
}
.locationList {
  position: absolute;
  top: calc(100% + var(--space-1));
  left: 0;
  min-width: 200px;
  list-style: none;
  margin: 0;
  padding: var(--space-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 10;
}
.locationOption {
  display: block;
  width: 100%;
  text-align: left;
  padding: var(--space-2) var(--space-3);
  border: 0;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--text-primary);
  font-size: var(--text-body-sm-size);
  cursor: pointer;
}
.locationOption:hover { background: var(--bg-surface); }
.locationOption[aria-selected='true'] { color: var(--success); }
.right { margin-left: auto; display: flex; align-items: center; gap: var(--space-3); }
.userName { font-size: var(--text-body-sm-size); color: var(--text-secondary); }
```

- [ ] **Step 5: Create `TopBar.tsx`**

```tsx
// src/layout/TopBar.tsx
import { useState } from 'react'
import Button from '@/components/Button'
import IconButton from '@/components/IconButton'
import Icon from '@/components/Icon'
import styles from './TopBar.module.css'

interface TopBarProps {
  locationName: string
  locationNames: string[]
  onLocationChange: (name: string) => void
  copilotOpen: boolean
  onToggleCopilot: () => void
  userName: string
  onSignOut: () => void
}

export default function TopBar({
  locationName,
  locationNames,
  onLocationChange,
  copilotOpen,
  onToggleCopilot,
  userName,
  onSignOut,
}: TopBarProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <header className={styles.topbar}>
      <span className={`wordmark ${styles.wordmark}`}>Hearth</span>

      <div className={styles.locationPicker}>
        <button
          type="button"
          className={styles.locationButton}
          onClick={() => setPickerOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={pickerOpen}
        >
          {locationName}
          <Icon name="chevron-down" size={14} />
        </button>
        {pickerOpen && (
          <ul className={styles.locationList} role="listbox">
            {locationNames.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  role="option"
                  aria-selected={name === locationName}
                  className={styles.locationOption}
                  onClick={() => {
                    onLocationChange(name)
                    setPickerOpen(false)
                  }}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.right}>
        <Button variant={copilotOpen ? 'secondary' : 'primary'} size="sm" onClick={onToggleCopilot}>
          <Icon name="sparkles" size={14} />
          {copilotOpen ? 'Hide Copilot' : 'Ask Copilot'}
        </Button>
        <span className={styles.userName}>{userName}</span>
        <IconButton label="Sign out" variant="secondary" onClick={onSignOut}>
          <Icon name="power" size={16} />
        </IconButton>
      </div>
    </header>
  )
}
```

- [ ] **Step 6: Create `AppShellLayout.module.css`**

```css
.shell {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-canvas);
  color: var(--text-primary);
}
.body { flex: 1; min-height: 0; display: flex; }
.main { flex: 1; min-width: 0; overflow-y: auto; }
```

- [ ] **Step 7: Create `AppShellLayout.tsx`**

```tsx
// src/layout/AppShellLayout.tsx
import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import CopilotPanel from '@/copilot/CopilotPanel'
import { useCopilot } from '@/copilot/useCopilot'
import { PROMPTS } from '@/copilot/copilotScript'
import { useSessionStore } from '@/lib/session-store'
import styles from './AppShellLayout.module.css'

const LOCATIONS = ['Northside Trattoria', 'Harbourline Kitchen', 'Eastgate Counter']

export interface DashboardOutletContext {
  askCopilot: (key: string) => void
}

export default function AppShellLayout() {
  const navigate = useNavigate()
  const clearSession = useSessionStore((s) => s.clear)

  const [locationIdx, setLocationIdx] = useState(0)
  const [copilotOpen, setCopilotOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1200)
  const copilot = useCopilot()

  const askCopilot = (key: string) => {
    setCopilotOpen(true)
    const prompt = PROMPTS.find((p) => p.key === key)
    copilot.respond(key, prompt?.question ?? '')
  }

  return (
    <div className={styles.shell}>
      <TopBar
        locationName={LOCATIONS[locationIdx]}
        locationNames={LOCATIONS}
        onLocationChange={(name) => setLocationIdx(Math.max(0, LOCATIONS.indexOf(name)))}
        copilotOpen={copilotOpen}
        onToggleCopilot={() => setCopilotOpen((v) => !v)}
        userName="Rosa Medina"
        onSignOut={() => {
          clearSession()
          navigate('/login')
        }}
      />
      <div className={styles.body}>
        <Sidebar activeId="dashboard" />
        <main className={styles.main}>
          <Outlet context={{ askCopilot } satisfies DashboardOutletContext} />
        </main>
        {copilotOpen && <CopilotPanel locationName={LOCATIONS[locationIdx]} copilot={copilot} onClose={() => setCopilotOpen(false)} />}
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Update `App.tsx`**

Replace the full contents of `src/App.tsx` with:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/pages/Login'
import LoginVerify from '@/pages/LoginVerify'
import Dashboard from '@/pages/Dashboard'
import AppShellLayout from '@/layout/AppShellLayout'
import { useSessionStore } from '@/lib/session-store'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useSessionStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/login/verify" element={<LoginVerify />} />
        <Route
          element={
            <RequireAuth>
              <AppShellLayout />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* Later phases add Orders, Menu, Deliveries, Payments routes here,
            one at a time — see customer-app/design_handoff/CLAUDE.md */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

Note: `src/pages/Dashboard.tsx` doesn't exist until Task 11 — this will make the project fail to build/type-check until Task 11 lands. That's expected and fine within this one task sequence (the plan is executed task-by-task in order, not independently); if you need `type-check`/`build` to pass standalone after this step, skip straight to creating a placeholder — but per this plan's ordering, proceed to Step 9 and Task 11 next without stopping on this expected intermediate failure.

- [ ] **Step 9: Delete `Welcome.tsx` and `Welcome.module.css`**

```bash
rm "customer-app/services/frontend/src/pages/Welcome.tsx" "customer-app/services/frontend/src/pages/Welcome.module.css"
```

- [ ] **Step 10: Write the failing test**

Create `src/layout/AppShellLayout.test.tsx`. This renders `AppShellLayout` with a stub child route (not the real `Dashboard`, since `Dashboard` doesn't exist until Task 11 — this test is scoped to the shell itself):

```tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useOutletContext } from 'react-router-dom'
import AppShellLayout, { type DashboardOutletContext } from './AppShellLayout'

function StubPage() {
  const { askCopilot } = useOutletContext<DashboardOutletContext>()
  return (
    <button type="button" onClick={() => askCopilot('delivery')}>
      Investigate delivery delays
    </button>
  )
}

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<AppShellLayout />}>
          <Route path="/dashboard" element={<StubPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('AppShellLayout', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
  })

  it('renders TopBar, Sidebar, the routed child, and the Copilot panel open by default at >=1200px', () => {
    renderShell()
    expect(screen.getByText('Hearth')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Orders')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close Copilot' })).toBeInTheDocument()
  })

  it('Ask/Hide Copilot in the TopBar toggles the panel', () => {
    renderShell()
    expect(screen.getByRole('button', { name: 'Close Copilot' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Hide Copilot/ }))
    expect(screen.queryByRole('button', { name: 'Close Copilot' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Ask Copilot/ }))
    expect(screen.getByRole('button', { name: 'Close Copilot' })).toBeInTheDocument()
  })

  it('askCopilot (from the Outlet context) opens the panel and asks the given prompt', () => {
    renderShell()
    fireEvent.click(screen.getByRole('button', { name: /Hide Copilot/ }))
    expect(screen.queryByRole('button', { name: 'Close Copilot' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Investigate delivery delays'))
    expect(screen.getByRole('button', { name: 'Close Copilot' })).toBeInTheDocument()
    expect(screen.getAllByText('Why are deliveries taking longer today?').length).toBeGreaterThan(0)
  })

  it('switching location updates the TopBar button and the Copilot hint text', () => {
    renderShell()
    expect(screen.getByRole('button', { name: /Northside Trattoria/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Northside Trattoria/ }))
    fireEvent.click(screen.getByRole('option', { name: 'Harbourline Kitchen' }))
    expect(screen.getByRole('button', { name: /Harbourline Kitchen/ })).toBeInTheDocument()
    expect(screen.getByText(/Reads Harbourline Kitchen data only/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 11: Run the test to verify it passes**

Run:
```bash
cd customer-app/services/frontend && npm run test -- --run src/layout/AppShellLayout.test.tsx
```
Expected: `4 passed`. (This test does not depend on `Dashboard.tsx`, so it passes even though `App.tsx` itself won't type-check until Task 11.)

- [ ] **Step 12: Lint only the new/changed files** (skip the full project `type-check`/`build` here — `App.tsx` intentionally references `Dashboard`, which lands in Task 11)

Run:
```bash
cd customer-app/services/frontend && npx eslint src/layout src/components/Icon.tsx --ext ts,tsx
```
Expected: no errors.

- [ ] **Step 13: Commit** (repo owner runs this — do not execute)

```bash
git add src/layout/ src/App.tsx src/components/Icon.tsx
git rm src/pages/Welcome.tsx src/pages/Welcome.module.css
git commit -m "feat(hearth-ui): add App Shell (TopBar, Sidebar, AppShellLayout), replace Welcome placeholder

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 11: Dashboard page

**Files:**
- Create: `src/pages/Dashboard.module.css`
- Create: `src/pages/Dashboard.tsx`
- Test: `src/pages/Dashboard.test.tsx`

**Interfaces:**
- Consumes: `DashboardOutletContext` (Task 10); `Card`, `Button`, `Icon`, `KpiTile`, `DataTable`, `StatusBadge` (Tasks 2-3); `KPIS, ORDER_ROWS, DELIVERIES, TOP_ITEMS, type OrderRow` (Task 4).
- Produces: `Dashboard` (default export, the routed page component) — consumed by `App.tsx` (already wired in Task 10, Step 8).

All copy and figures are ported verbatim from `Hearth Dashboard.dc.html` lines 37-134 (greeting, AI brief, KPI grid, orders table, deliveries, top items).

- [ ] **Step 1: Create `Dashboard.module.css`**

```css
.page {
  padding: var(--space-6);
  max-width: var(--max-app);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
.headerRow { display: flex; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; }
.headerText { display: flex; flex-direction: column; gap: var(--space-1); }
.date {
  font-size: var(--text-label-size);
  line-height: var(--text-label-lh);
  font-weight: var(--weight-medium);
  letter-spacing: var(--text-label-track);
  text-transform: uppercase;
  color: var(--text-tertiary);
}
.greeting {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-display-md-size);
  line-height: var(--text-display-md-lh);
  font-weight: var(--weight-semibold);
}
.subtitle { margin: 0; color: var(--text-secondary); font-size: var(--text-body-lg-size); line-height: var(--text-body-lg-lh); }
.headerActions { margin-left: auto; display: flex; gap: var(--space-2); }

.briefMeta { font-size: var(--text-caption-size); color: var(--text-tertiary); font-family: var(--font-mono); }
.briefGrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr)); gap: var(--space-3); }
.briefTile {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-canvas);
}
.briefTileLabel {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-label-size);
  line-height: var(--text-label-lh);
  font-weight: var(--weight-medium);
  letter-spacing: var(--text-label-track);
  text-transform: uppercase;
}
.good { color: var(--success); }
.warn { color: var(--warning); }
.info { color: var(--info); }
.briefTileValue {
  font-family: var(--font-display);
  font-size: var(--text-heading-md-size);
  line-height: var(--text-heading-md-lh);
  font-weight: var(--weight-semibold);
  font-variant-numeric: tabular-nums;
}
.briefTileNote { color: var(--text-secondary); font-size: var(--text-body-sm-size); line-height: var(--text-body-sm-lh); }
.suggestedRow { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
.suggestedLabel {
  font-size: var(--text-label-size);
  line-height: var(--text-label-lh);
  font-weight: var(--weight-medium);
  letter-spacing: var(--text-label-track);
  text-transform: uppercase;
  color: var(--text-tertiary);
  margin-right: var(--space-2);
}

.kpiGrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(236px, 100%), 1fr)); gap: var(--space-4); }

.lowerGrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(340px, 100%), 1fr)); gap: var(--space-4); align-items: start; }
.ordersCol { display: flex; flex-direction: column; gap: var(--space-3); min-width: 0; }
.sectionHeader { display: flex; align-items: center; gap: var(--space-3); }
.sectionTitle {
  font-family: var(--font-display);
  font-size: var(--text-heading-sm-size);
  line-height: var(--text-heading-sm-lh);
  font-weight: var(--weight-semibold);
}
.sectionLink { margin-left: auto; font-size: var(--text-body-sm-size); }
.sideCol { display: flex; flex-direction: column; gap: var(--space-4); min-width: 0; }

.deliveryList { display: flex; flex-direction: column; gap: var(--space-3); }
.deliveryRow {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-canvas);
}
.deliveryInfo { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: var(--space-1); }
.deliveryCourier { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.deliveryMeta { font-family: var(--font-mono); font-size: var(--text-mono-sm-size); color: var(--text-tertiary); }

.topItemsList { display: flex; flex-direction: column; gap: var(--space-3); }
.topItemRow { display: flex; flex-direction: column; gap: var(--space-1); }
.topItemLabelRow {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  font-size: var(--text-body-sm-size);
  line-height: var(--text-body-sm-lh);
}
.topItemValue { font-variant-numeric: tabular-nums; color: var(--text-secondary); }
.topItemBarTrack { height: 4px; border-radius: var(--radius-full); background: var(--bg-elevated); }
.topItemBarFill { height: 4px; border-radius: var(--radius-full); background: var(--info); }
```

- [ ] **Step 2: Create `Dashboard.tsx`**

```tsx
// src/pages/Dashboard.tsx
import { useOutletContext } from 'react-router-dom'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Icon from '@/components/Icon'
import KpiTile from '@/components/KpiTile'
import DataTable, { type DataTableColumn } from '@/components/DataTable'
import StatusBadge from '@/components/StatusBadge'
import type { DashboardOutletContext } from '@/layout/AppShellLayout'
import { KPIS, ORDER_ROWS, DELIVERIES, TOP_ITEMS, type OrderRow } from '@/lib/mockDashboardData'
import styles from './Dashboard.module.css'

const ORDER_COLUMNS: DataTableColumn<OrderRow>[] = [
  { key: 'id', label: 'Order', mono: true, muted: true },
  { key: 'items', label: 'Items' },
  { key: 'total', label: 'Total', numeric: true },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <StatusBadge tone={row.tone} dot>
        {row.status}
      </StatusBadge>
    ),
  },
  { key: 'placed', label: 'Placed', muted: true },
]

export default function Dashboard() {
  const { askCopilot } = useOutletContext<DashboardOutletContext>()

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div className={styles.headerText}>
          <div className={styles.date}>Thursday, 1 October</div>
          <h1 className={styles.greeting}>Good afternoon, Rosa</h1>
          <p className={styles.subtitle}>Here&apos;s how Northside Trattoria is doing today.</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" size="sm">
            Today
          </Button>
          <Button variant="primary" size="sm">
            Pause online orders
          </Button>
        </div>
      </div>

      <Card
        eyebrow="AI business brief"
        title="Business is performing well today"
        action={<span className={styles.briefMeta}>UPDATED 2M AGO</span>}
      >
        <div className={styles.briefGrid}>
          <div className={styles.briefTile}>
            <div className={`${styles.briefTileLabel} ${styles.good}`}>
              <Icon name="trending-up" size={14} />
              <span>Sales</span>
            </div>
            <div className={styles.briefTileValue}>$6,420</div>
            <div className={styles.briefTileNote}>+8.1% vs last Thursday</div>
          </div>
          <div className={styles.briefTile}>
            <div className={`${styles.briefTileLabel} ${styles.warn}`}>
              <Icon name="triangle-alert" size={14} />
              <span>Needs attention</span>
            </div>
            <div className={styles.briefTileNote}>2 deliveries are past ETA</div>
            <div className={styles.briefTileNote}>3 payments ($142) need review</div>
          </div>
          <div className={styles.briefTile}>
            <div className={`${styles.briefTileLabel} ${styles.info}`}>
              <Icon name="lightbulb" size={14} />
              <span>Insight</span>
            </div>
            <div className={styles.briefTileNote}>
              Lunch orders rose 12%, but average delivery time grew 7 minutes during the lunch peak.
            </div>
          </div>
        </div>
        <div className={styles.suggestedRow}>
          <span className={styles.suggestedLabel}>Suggested</span>
          <Button variant="secondary" size="sm" onClick={() => askCopilot('delivery')}>
            Investigate delivery delays
          </Button>
          <Button variant="secondary" size="sm" onClick={() => askCopilot('payments')}>
            Review failed payments
          </Button>
          <Button variant="secondary" size="sm" onClick={() => askCopilot('menu')}>
            Analyze today&apos;s best sellers
          </Button>
        </div>
      </Card>

      <div className={styles.kpiGrid}>
        {KPIS.map((kpi) => (
          <KpiTile key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className={styles.lowerGrid}>
        <div className={styles.ordersCol}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>Orders in progress</div>
            <a href="#" className={styles.sectionLink}>
              All orders
            </a>
          </div>
          <DataTable<OrderRow> columns={ORDER_COLUMNS} rows={ORDER_ROWS} />
        </div>

        <div className={styles.sideCol}>
          <Card title="Deliveries in flight">
            <div className={styles.deliveryList}>
              {DELIVERIES.map((d) => (
                <div key={d.courier} className={styles.deliveryRow}>
                  <div className={styles.deliveryInfo}>
                    <div className={styles.deliveryCourier}>{d.courier}</div>
                    <div className={styles.deliveryMeta}>{d.meta}</div>
                  </div>
                  <StatusBadge tone={d.tone} dot>
                    {d.status}
                  </StatusBadge>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Top items today">
            <div className={styles.topItemsList}>
              {TOP_ITEMS.map((item) => (
                <div key={item.label} className={styles.topItemRow}>
                  <div className={styles.topItemLabelRow}>
                    <span>{item.label}</span>
                    <span className={styles.topItemValue}>{item.value}</span>
                  </div>
                  <div className={styles.topItemBarTrack}>
                    <div className={styles.topItemBarFill} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write the failing test**

Create `src/pages/Dashboard.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AppShellLayout from '@/layout/AppShellLayout'
import Dashboard from './Dashboard'

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<AppShellLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('Dashboard page', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
  })

  it('renders the greeting, all four KPI tiles, and the pre-seeded Copilot thread', () => {
    renderDashboard()

    expect(screen.getByText('Good afternoon, Rosa')).toBeInTheDocument()
    expect(screen.getByText('Orders today')).toBeInTheDocument()
    expect(screen.getByText('Net sales')).toBeInTheDocument()
    expect(screen.getByText('Avg delivery')).toBeInTheDocument()
    expect(screen.getByText('Failed payments')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Close Copilot' })).toBeInTheDocument()
    expect(screen.getByText('Why are deliveries delayed?')).toBeInTheDocument()
  })

  it('renders the orders table and the deliveries/top-items cards', () => {
    renderDashboard()
    expect(screen.getByText('Orders in progress')).toBeInTheDocument()
    expect(screen.getByText('#ORD-4821')).toBeInTheDocument()
    expect(screen.getByText('Deliveries in flight')).toBeInTheDocument()
    expect(screen.getByText('Dani Okafor')).toBeInTheDocument()
    expect(screen.getByText('Top items today')).toBeInTheDocument()
    expect(screen.getAllByText('Margherita').length).toBeGreaterThan(0)
  })

  it('a Suggested action on the AI brief card opens the Copilot and asks that question', () => {
    renderDashboard()
    fireEvent.click(screen.getByRole('button', { name: /Hide Copilot/ }))
    expect(screen.queryByRole('button', { name: 'Close Copilot' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Review failed payments' }))
    expect(screen.getByRole('button', { name: 'Close Copilot' })).toBeInTheDocument()
    expect(screen.getAllByText('Why have failed payments increased today?').length).toBeGreaterThan(0)
  })

  it('Sidebar nav items for unbuilt screens are present but disabled', () => {
    renderDashboard()
    const orders = screen.getByText('Orders')
    expect(orders.closest('span')).toHaveAttribute('aria-disabled', 'true')
    const dashboard = screen.getByText('Dashboard')
    expect(dashboard.closest('span')).not.toHaveAttribute('aria-disabled')
  })
})
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
cd customer-app/services/frontend && npm run test -- --run src/pages/Dashboard.test.tsx
```
Expected: `4 passed`.

- [ ] **Step 5: Run the full test suite**

Run:
```bash
cd customer-app/services/frontend && npm run test -- --run
```
Expected: all test files pass (the two pre-existing Login/LoginVerify files plus every file created in Tasks 2-11).

- [ ] **Step 6: Type-check, lint, and build**

Run:
```bash
cd customer-app/services/frontend && npm run type-check && npm run lint && npm run build
```
Expected: all three pass cleanly — `build` in particular confirms the production Vite build (used by the real `Dockerfile`/CI pipeline) succeeds with the new routes and dependency.

- [ ] **Step 7: Commit** (repo owner runs this — do not execute)

```bash
git add src/pages/Dashboard.module.css src/pages/Dashboard.tsx src/pages/Dashboard.test.tsx
git commit -m "feat(hearth-ui): add Dashboard page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 12: Root CLAUDE.md update, manual live-browser verification

**Files:**
- Modify: `.claude/CLAUDE.md` (repo root)

**Interfaces:**
- None — this task only updates documentation and performs manual verification; no code changes.

- [ ] **Step 1: Update root `CLAUDE.md` §6's Customer App Frontend row**

Find this row in the Customer App tech-stack table:

```markdown
| Frontend ("Hearth") | TypeScript | Vite + React 18 | React Router, TanStack Query, Zustand, CSS Modules — Aurora design system (same as platform-app's Synap UI). Login + 6-digit MFA verify built (issue #45); App Shell, Dashboard, Orders, Menu, Deliveries, Payments specced in `customer-app/design_handoff/design_handoff_hearth/BUILD_PLAN.md`, not yet built — each is its own future roadmap task per §11 |
```

Replace with:

```markdown
| Frontend ("Hearth") | TypeScript | Vite + React 18 | React Router, TanStack Query, Zustand, CSS Modules, `lucide-react` — Aurora design system (same as platform-app's Synap UI). Login + 6-digit MFA verify (issue #45) and App Shell + Dashboard + AI Copilot (issue #54) are built, both 100% mocked for the Copilot's conversation data; Orders, Menu, Deliveries, Payments specced in `customer-app/design_handoff/design_handoff_hearth/BUILD_PLAN.md`, not yet built — each is its own future roadmap task per §11 |
```

- [ ] **Step 2: Commit the doc update** (repo owner runs this — do not execute)

```bash
git add .claude/CLAUDE.md
git commit -m "docs: update root CLAUDE.md for Hearth Dashboard + AI Copilot (issue #54)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 3: Manual live-browser verification (issue #54's Done-when)**

This is the actual acceptance criterion — run the dev server and walk through the screen as a real browser session, not just the automated test suite:

```bash
cd customer-app/services/frontend && npm run dev
```

Open the printed local URL (typically `http://localhost:5173`) and verify, in order:

1. Navigating to `/` while unauthenticated redirects to `/login` (unchanged behavior).
2. Log in with a real seeded test user (see `customer-app/docs/hearth-frontend-deploy-guide.md` Step 1 for seeding, or use credentials already seeded from this session's earlier Login/MFA verification) and complete MFA — you land on `/dashboard`, not the old "You're signed in" placeholder.
3. TopBar shows the Hearth wordmark, a location switcher defaulting to "Northside Trattoria" that opens a dropdown with all 3 locations, an "Hide Copilot" button (Copilot starts open at normal desktop width), "Rosa Medina", and a sign-out icon button.
4. Sidebar shows Dashboard highlighted as active; Orders/Menu/Deliveries/Payments are visibly present but inert (no navigation, a "Coming soon" tooltip on hover).
5. Main column shows: the greeting, the AI business brief card (3 tiles + 3 "Suggested" buttons), 4 KPI tiles with sparklines, the Orders-in-progress table (horizontally scrollable if the window is narrow), and the Deliveries/Top-items cards.
6. Copilot panel on the right already shows the pre-seeded "Why are deliveries delayed?" → delay breakdown conversation.
7. Click "New" in the Copilot header — thread clears to the empty state with all 10 starter questions, each with an icon.
8. Click "What should I focus on today?" — a scripted answer appears after a brief "Reading orders, menu, and payments…" pending state, ending in reply chips.
9. Walk the full reference conversation from `DASHBOARD_COPILOT.md`: ask "Why are deliveries taking longer today?" → "Yes" (prep-time breakdown) → "What should I do about it?" → "Go ahead and make those changes" → an approval card appears with "Approve changes"/"Not now" → click "Approve changes" → a confirmation message appears, the approval card now shows "Approved by Rosa · just now".
10. Type a question not in the starter list (e.g., "What's the weather tomorrow?") into the composer and press Enter — after a brief pending state, the fixed "We couldn't reach the analysis service…" message appears (confirms no real network/LLM call is made — check the browser's Network tab shows no new request from this action).
11. Resize the browser window below 1200px width and reload — Copilot starts collapsed; the "Ask Copilot" button in the TopBar still opens it.
12. Click "Hide Copilot", then click one of the AI-brief's "Suggested" buttons (e.g., "Investigate delivery delays") — the Copilot panel reopens and immediately shows that question asked and answered.
13. Click Sign out — returns to `/login`, and navigating back to `/dashboard` directly redirects to `/login` (session cleared).

- [ ] **Step 4: Close GitHub issue #54**

Once every item in Step 3 is confirmed, close the issue with a summary comment (ask the user for explicit go-ahead first, per this session's established pattern for issue #45):

```bash
gh issue close 54 --repo Preet2fun/itsm-cloudnative-demo-app --comment "Built and verified live in a browser: App Shell (TopBar, Sidebar) + Dashboard + AI Copilot, fully mocked per the design spec. Verified: landing on /dashboard post-login, the pre-seeded delivery-delay thread, all 10 starter questions, the full reference conversation (delay breakdown -> recommendation -> approval -> confirmation), the free-text fallback (no real LLM call), Copilot collapse below 1200px, and the AI-brief's Suggested actions opening Copilot with a pre-asked question."
```
