// services/frontend/src/components/layout/Sidebar.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  HomeIcon,
  ExclamationTriangleIcon,
  ServerStackIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import { getClaims, logout } from "@/lib/auth";

// ─── NAV ITEMS ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: HomeIcon,
    matchExact: true,
  },
  {
    label: "Incidents",
    href: "/incidents",
    icon: ExclamationTriangleIcon,
    matchExact: false,
  },
  {
    label: "Assets",
    href: "/assets",
    icon: ServerStackIcon,
    matchExact: false,
  },
] as const;

// ─── ROLE BADGE ───────────────────────────────────────────────────────────────

const roleBadgeStyles: Record<string, string> = {
  admin: "bg-blue-500/20 text-blue-300 ring-blue-500/30",
  agent: "bg-violet-500/20 text-violet-300 ring-violet-500/30",
  viewer: "bg-slate-500/20 text-slate-300 ring-slate-500/30",
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const claims = getClaims();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  function isActive(href: string, matchExact: boolean): boolean {
    if (matchExact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  const w = collapsed ? "w-[60px]" : "w-[240px]";

  // Sync main content margin-left when sidebar collapses/expands
  useEffect(() => {
    const main = document.getElementById("main-content");
    if (main) {
      main.style.marginLeft = collapsed ? "60px" : "240px";
    }
  }, [collapsed]);

  return (
    <aside
      className={`
        ${w} shrink-0 flex flex-col h-screen bg-slate-800 transition-[width] duration-200
        overflow-hidden fixed top-0 left-0 z-40
      `}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 h-[60px] px-4 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center justify-center w-7 h-7 bg-blue-500 rounded-lg shrink-0">
          <BriefcaseIcon className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm leading-tight truncate">
              ITSM Portal
            </p>
            <p className="text-slate-400 text-[11px] leading-tight uppercase tracking-wider truncate">
              {claims?.tenant_id?.replace("tenant_", "") ?? "—"}
            </p>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map(({ label, href, icon: Icon, matchExact }) => {
          const active = isActive(href, matchExact);
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg mb-0.5
                text-[13.5px] font-medium transition-colors duration-100
                border-l-[3px] ${collapsed ? "justify-center px-0 mx-0 rounded-none" : ""}
                ${
                  active
                    ? "border-blue-400 bg-blue-500/15 text-blue-300"
                    : "border-transparent text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                }
              `}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* ── User info + logout ── */}
      <div className="border-t border-white/[0.06] p-3 shrink-0">
        {!collapsed && claims && (
          <div className="mb-2 px-2 py-2.5 rounded-lg bg-white/[0.04]">
            <p
              className="text-slate-200 text-[12.5px] font-medium truncate"
              title={claims.email}
            >
              {claims.email}
            </p>
            <span
              className={`
                mt-1 inline-block text-[10px] font-semibold uppercase tracking-wider
                px-1.5 py-0.5 rounded ring-1
                ${roleBadgeStyles[claims.role] ?? roleBadgeStyles.viewer}
              `}
            >
              {claims.role}
            </span>
          </div>
        )}

        {/* Logout button */}
        <button
          onClick={handleLogout}
          title="Sign out"
          className={`
            flex items-center gap-2.5 w-full px-3 py-2 rounded-lg
            text-slate-400 hover:bg-red-500/10 hover:text-red-400
            transition-colors duration-100 text-[13px]
            ${collapsed ? "justify-center" : ""}
          `}
        >
          <ArrowRightOnRectangleIcon className="w-[17px] h-[17px] shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`
            flex items-center gap-2.5 w-full px-3 py-2 mt-0.5 rounded-lg
            text-slate-500 hover:bg-white/[0.05] hover:text-slate-300
            transition-colors duration-100 text-[13px]
            ${collapsed ? "justify-center" : ""}
          `}
        >
          {collapsed ? (
            <ChevronRightIcon className="w-[17px] h-[17px]" />
          ) : (
            <>
              <ChevronLeftIcon className="w-[17px] h-[17px]" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
