repo: Preet2fun/itsm-cloudnative-demo-app
branch: main

## Last sync
date: 2026-09-17T00:00:00Z

### Updated in this project
- Built "Hearth" — a sibling product to Synap: restaurant back-office console (foundations, login + 6-digit MFA, app shell, dashboard).
- Reused the repo's multi-tenant conventions: tenant resolved server-side, single tenant-scoped admin role, agent/viewer in schema but unused.
- Auth designed to the stated contract (/auth/login → /auth/mfa/send → /auth/mfa/verify); no SSO, no tenant field.
- Added `design_handoff_hearth/` — README, BUILD_PLAN, and a framework-agnostic reference prototype.
- Removed the earlier Synap/ITSM scaffolding (Customer App.dc.html) at the user's request.

## Screen map
| Project screen | Repo files |
| --- | --- |
| Hearth 01 Login + verify | docs/platform/03_Multi_Tenancy.md (tenant resolution, roles) |
| Hearth 02 App shell (location switcher) | docs/platform/03_Multi_Tenancy.md |
| Hearth 00 Foundations | none — Aurora design system tokens |
| Hearth 03 Dashboard | none — new surface, no repo counterpart |
| Hearth 04-07 (Orders, Menu, Deliveries, Payments) | specced only; see design_handoff_hearth/BUILD_PLAN.md |

## Sync history
- 2026-08-26T11:58:11Z — read multi-tenancy and data-model docs; built Synap/ITSM scaffolding (since replaced by Hearth).
