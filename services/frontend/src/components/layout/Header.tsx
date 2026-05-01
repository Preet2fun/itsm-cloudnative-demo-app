// services/frontend/src/components/layout/Header.tsx
"use client";

import { BellIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { getClaims } from "@/lib/auth";

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface HeaderProps {
  /** Page title displayed in the top bar */
  title: string;
  /** Optional breadcrumb segments rendered above the title */
  breadcrumbs?: { label: string; href?: string }[];
}

// ─── USER AVATAR INITIALS ─────────────────────────────────────────────────────

function initials(email: string): string {
  const parts = email.split("@")[0].split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function Header({ title, breadcrumbs }: HeaderProps) {
  const claims = getClaims();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const tenantDisplay = claims?.tenant_id
    ? claims.tenant_id.replace("tenant_", "").toUpperCase()
    : null;

  return (
    <header className="h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-6 gap-4 sticky top-0 z-30">
      {/* ── Left: breadcrumbs + title ── */}
      <div className="flex flex-col justify-center min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 mb-0.5">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && (
                  <ChevronDownIcon className="w-3 h-3 text-slate-300 -rotate-90" />
                )}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="text-[11px] text-blue-500 hover:underline font-medium"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-[17px] font-bold text-slate-900 leading-tight truncate">
          {title}
        </h1>
      </div>

      {/* ── Right: tenant chip + notifications + user menu ── */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Tenant chip */}
        {tenantDisplay && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
              {tenantDisplay}
            </span>
          </div>
        )}

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((o) => !o);
              setUserOpen(false);
            }}
            className="relative flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <BellIcon className="w-5 h-5" />
            {/* Unread indicator — placeholder; wire to real count in Phase 2 */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>

          {/* Notification dropdown (placeholder) */}
          {notifOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotifOpen(false)}
              />
              <div className="absolute right-0 top-[calc(100%+8px)] w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <span className="text-[13px] font-bold text-slate-900">
                    Notifications
                  </span>
                  <span className="text-[11px] text-blue-500 font-semibold cursor-pointer hover:underline">
                    Mark all read
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                  <BellIcon className="w-8 h-8 text-slate-300" />
                  <p className="text-[13px]">No new notifications</p>
                  <p className="text-[11px] text-slate-300">
                    Real-time alerts coming in Phase 2
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User menu */}
        {claims && (
          <div className="relative">
            <button
              onClick={() => {
                setUserOpen((o) => !o);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2 h-9 pl-1 pr-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                {initials(claims.email)}
              </div>
              <span className="text-[13px] font-medium text-slate-700 max-w-[140px] truncate hidden sm:block">
                {claims.email}
              </span>
              <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown */}
            {userOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserOpen(false)}
                />
                <div className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-[13px] font-semibold text-slate-900 truncate">
                      {claims.email}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 capitalize">
                      {claims.role} · {tenantDisplay}
                    </p>
                  </div>
                  <div className="p-1.5">
                    <a
                      href="/login"
                      onClick={(e) => {
                        e.preventDefault();
                        import("@/lib/auth").then(({ logout }) => {
                          logout();
                          window.location.href = "/login";
                        });
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Sign out
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
