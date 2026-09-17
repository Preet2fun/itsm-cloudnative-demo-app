# Aurora Design System

An enterprise design system for **observability, ITSM, and AIOps** surfaces: dense data-first
layouts, repeatable patterns, near-black dark canvases, and a signature **green → teal → blue**
gradient reserved for brand moments.

- **Working title.** "Aurora" is the placeholder name carried over from the source document.
  Rename the wordmark, the `ui_kits/` copy, and this file before publishing.
- **Themes.** Dark is primary (`<html data-theme="dark">`), light is at parity (`data-theme="light"`).
- **Source of truth.** `uploads/DESIGN.md` — the brand + system specification supplied by the user.
  Every token, component, and screen here traces back to a numbered section of that document.
  No codebase, Figma file, screenshots, decks, or logo assets were provided.

## Product context

The document describes two surface families, both built here as UI kits:

| Surface | What it is | Kit |
| --- | --- | --- |
| **Aurora Ops** (app) | Desktop-first operator console: dashboards, incidents, monitors, logs, traces, settings. Dense, keyboard-driven, Cmd+K as first-class navigation. | `ui_kits/app/` |
| **Aurora site** (marketing) | Mobile-first marketing surface: hero with gradient headline, metrics strip, feature grid, footer. | `ui_kits/marketing/` |

## Content fundamentals

Voice is **direct, engineering-grade, calm** — closer to a control room than a marketing site.

- **Sentence case everywhere** — buttons, headers, menu items, toasts. Only proper nouns and
  product names take title case. "Create monitor", not "Create Monitor".
- **Short over polite.** "Delete this monitor?" — not "Are you sure you'd like to remove this
  monitor from your account?"
- **Numbers stay numeric.** "3 alerts", never "three alerts". Never print a bare `0` — write
  "None" or "No alerts yet".
- **Time is relative in-app.** "2m ago", "3h ago", "Yesterday, 14:32". Absolute UTC on hover.
- **Errors own the problem.** "We couldn't reach the agent" — never "You have an error".
  First person plural for the system, second person only when the user must act.
- **No emoji. No decorative icons in body text.** Icons appear in controls, nav, and status only.
- Labels are terse and uppercase at 12px (`--text-label`): "OWNER", "LAST UPDATE", "SEVERITY".
- Marketing copy carries the same restraint: one claim per line, no exclamation marks,
  headline verbs ("Observe everything. Miss nothing.").

## Visual foundations

**Type.** Display = Space Grotesk (geometric, heavy, tracked tight: −0.02 to −0.03em, hero
line-height 0.95). UI/body = Inter Tight. Mono = JetBrains Mono for logs, IDs, metric names,
shortcuts. Weights limited to 400/500/600/700 — never 300 or 900, never italic in UI.
Body default 14/20; dashboards and tables drop to 13/18 for density.

**Color.** Near-black canvas `#050810` → surface `#0B111C` → elevated `#141924`, inset `#030509`.
Light mode canvas is off-white `#F7F8FB`, never pure white. Four text steps carry hierarchy.
Semantic roles (success/info/warning/danger/neutral) each have a strong and a soft variant;
severity maps P1→danger … Resolved→success. The categorical data-viz palette is ordered — always
start at `--viz-1`.

**The gradient.** `linear-gradient(90deg, #22E06B, #21D0C4, #2AA5F5)`. At most **one element per
screen**: the wordmark, the hero's final phrase, or a single KPI ring. Never a background wash,
never on body text, chart lines, or table cells. Primary buttons are a neutral solid, not gradient.

**Backgrounds.** One decorative treatment only: a 24px dot grid at 4–6% opacity
(`.aurora-dotgrid`). No photography, no illustration, no glassmorphism, no aurora washes.
Product imagery appears as bordered striped placeholder panels with mono captions until real
captures are dropped in.

**Corners & cards.** Radii are small: 2 chips, 4 inputs/buttons, 6 cards/panels, 8 dialogs,
full only for pills. Cards = 1px `--border-default` + `--bg-surface` + radius 6 + 16–24 padding,
optional uppercase eyebrow above a 16px semibold title. Never more than 3 nested cards.

**Elevation.** Dark mode elevates by *lighter background step*, never shadow. Light mode uses the
three-step shadow ramp. Borders do the separating work; hover raises `--border-default` →
`--border-strong`.

**Layout.** 12-column grid, 24px gutters, 4px spacing base, max 1440 app / 1200 marketing /
760 reading. Left-aligned always — long-form text and dashboard headings are never centered.
Fixed chrome: 56px top bar, 240/56px sidebar, sticky table headers, sticky save bar when a form
is dirty. Tables stay tables at every breakpoint (horizontal scroll + sticky first column below md).

**States.** Hover = one background step up (`--bg-elevated`) plus a stronger border; solid
buttons lift with `filter: brightness(1.08)`. Active/selected = 2px signal-green rail (sidebar,
table row, tabs) or elevated fill. Focus = 2px signal-green ring at 2px offset, on every
interactive element. Disabled = 45% opacity, `--text-disabled`. No press-shrink, no scale
transforms.

**Motion.** 120/180/240ms on `cubic-bezier(0.2, 0.8, 0.2, 1)`. Hover, focus, disclosure, tabs,
tooltip, toast only. No parallax, no scroll-jacking, no page transitions. Skeletons pulse on a
1s cycle; spinners rotate at 800ms and only for waits under 5s. `prefers-reduced-motion` is honored
globally in `tokens/base.css`.

**Transparency & blur.** Borders and dot grid use rgba over the canvas; backdrops are
`rgba(5,8,16,0.6)` dark / `rgba(11,17,28,0.4)` light. No blur effects anywhere else — the one
soft treatment permitted is the low-opacity gradient glow behind a marketing product shot.

**Charts.** 1.5px lines, markers off by default, horizontal gridlines only in `--border-subtle`,
legends bottom/right in caption size, tooltips on `--bg-elevated`. Tabular figures in every
numeric cell. No pie charts above 5 categories.

## Iconography

- **Set:** [Lucide](https://lucide.dev) — stroke-based, 1.5px on a 24px grid, rounded caps.
  This is a **substitution**: DESIGN.md §10 specifies "a single open-source line-icon set" without
  naming one, and Lucide matches the described weight, grid, and terminal style exactly.
- **Delivery:** loaded from CDN (`unpkg.com/lucide-static@0.395.0`) and inlined by
  `components/icon/Icon.jsx` so glyphs inherit `currentColor` and recolor per theme. No icon font,
  no sprite sheet, no PNG icons in the source material.
- **Sizes:** 14 / 16 (default) / 20 / 24. One weight only; filled variants only for a selected state.
- **Never:** emoji, unicode glyphs as icons, hand-drawn SVGs, mixed stroke weights. Every
  icon-only button carries an `aria-label`.
- The two non-Lucide glyphs in the system are typographic: `×` for dismiss and `›` for breadcrumb
  separators, both specified by the source document.

## Assets

**No logo, mark, illustration, or photography was supplied.** Nothing has been invented in their
place — wherever a mark belongs, the system renders the gradient **wordmark**
(`components/brand/Wordmark.jsx`), and image areas are explicit placeholder panels. Send real
logo files, product screenshots, and any brand imagery and they will be wired in.

## Intentional additions

The source document defines components in §9–§11; three additions fill gaps it implies but
doesn't name:

- `Icon` — wrapper enforcing the single icon set, stroke weight, and size scale (§10).
- `Field` — the label/helper/error wrapper described in §9.2 as a layout rule rather than a component.
- `Sparkline` — the 1.5px, marker-less line from §11, needed by KPI tiles in §13.2.

## Index

| Path | What's there |
| --- | --- |
| `styles.css` | The only file consumers link — `@import`s every token file |
| `tokens/` | `fonts`, `colors`, `typography`, `spacing`, `elevation`, `motion`, `base` |
| `guidelines/` | 20 foundation specimen cards (Colors, Type, Spacing, Brand) |
| `components/` | React primitives, grouped by concern (below) |
| `ui_kits/app/` | Aurora Ops console — login, dashboard, incident detail, settings, shell |
| `ui_kits/marketing/` | Aurora site — header, hero, feature grid, footer |
| `SKILL.md` | Agent-skill entry point for Claude Code |

### Components

| Group | Components |
| --- | --- |
| `components/icon/` | `Icon` |
| `components/actions/` | `Button`, `IconButton` |
| `components/forms/` | `Field`, `Input`, `Textarea`, `Select` |
| `components/status/` | `StatusBadge`, `SeverityBadge`, `FilterChip` |
| `components/surfaces/` | `Card`, `Dialog`, `CommandPalette` |
| `components/data/` | `Table`, `LogViewer`, `Sparkline` |
| `components/navigation/` | `Sidebar`, `TopBar`, `Tabs`, `Breadcrumbs` |
| `components/feedback/` | `Toast`, `EmptyState`, `Skeleton`, `Spinner`, `ProgressBar` |
| `components/brand/` | `Wordmark`, `GradientHeadline`, `KpiTile` |

## Known substitutions

1. **Mono font** — DESIGN.md leaves the mono family to the implementer; JetBrains Mono is used
   (slashed zero, distinct `1 l I`, clean italic). Swap `--font-mono` to change it.
2. **Icon set** — Lucide, as described above.
3. **Webfonts are loaded from Google Fonts**, not self-hosted binaries; the document asks for
   self-hostable families, which all three are. Send the files and `tokens/fonts.css` becomes
   `@font-face` rules.
