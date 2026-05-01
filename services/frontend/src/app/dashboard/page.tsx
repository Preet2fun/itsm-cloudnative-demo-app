// services/frontend/src/app/dashboard/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ExclamationTriangleIcon,
  ServerStackIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  FireIcon,
} from "@heroicons/react/24/outline";
import { incidentsApi, assetsApi } from "@/lib/api";
import type { Incident, Asset } from "@/lib/types";
import { PriorityBadge, StatusBadge } from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Table, { type Column } from "@/components/ui/Table";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  const hrs = Math.floor(min / 60);
  const days = Math.floor(hrs / 24);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

/** Returns minutes until SLA breach (negative = already breached) */
function minutesUntilBreach(sla_breach_at: string): number {
  return Math.floor((new Date(sla_breach_at).getTime() - Date.now()) / 60_000);
}

function formatCountdown(minutes: number): string {
  if (minutes <= 0) return "Breached";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconColor: string;   // Tailwind text-* class
  iconBg: string;      // Tailwind bg-* class
  href?: string;
  loading?: boolean;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor,
  iconBg,
  href,
  loading,
}: StatCardProps) {
  const content = (
    <div
      className="
        group flex flex-col gap-3 p-5
        bg-white dark:bg-slate-900
        border border-slate-200 dark:border-slate-800
        rounded-xl
        hover:shadow-md transition-shadow duration-150
      "
    >
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>

      {loading ? (
        <div className="h-9 w-16 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
      ) : (
        <span className="text-[32px] font-extrabold leading-none text-slate-900 dark:text-white">
          {value}
        </span>
      )}

      {sub && (
        <span className="text-[12px] text-slate-400 dark:text-slate-500">{sub}</span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

// ─── SLA BREACH ROW ───────────────────────────────────────────────────────────

function SLABreachRow({ incident }: { incident: Incident }) {
  const mins = minutesUntilBreach(incident.sla_breach_at);
  const breached = mins <= 0;

  return (
    <Link
      href={`/incidents/${incident.id}`}
      className="
        flex items-center gap-4 px-4 py-3
        rounded-lg border
        border-red-200 dark:border-red-900/60
        bg-red-50 dark:bg-red-900/10
        hover:bg-red-100 dark:hover:bg-red-900/20
        transition-colors duration-100
        group
      "
    >
      {/* Countdown pill */}
      <span
        className={`
          shrink-0 flex items-center gap-1.5
          px-2.5 py-1 rounded-md text-[12px] font-bold
          ${breached
            ? "bg-red-600 text-white"
            : "bg-red-100 dark:bg-red-800/40 text-red-700 dark:text-red-300"
          }
        `}
      >
        <ClockIcon className="w-3.5 h-3.5" />
        {breached ? "BREACHED" : formatCountdown(mins)}
      </span>

      {/* ID */}
      <span className="font-mono text-[12px] font-bold text-red-600 dark:text-red-400 shrink-0">
        {incident.id}
      </span>

      {/* Title */}
      <span className="flex-1 text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate">
        {incident.title}
      </span>

      {/* Priority */}
      <PriorityBadge value={incident.priority} size="sm" />

      {/* Arrow */}
      <ArrowRightIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-500 transition-colors shrink-0" />
    </Link>
  );
}

// ─── ERROR BANNER ─────────────────────────────────────────────────────────────

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-[13px]">
      <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
        <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
        <span>{message}</span>
      </div>
      <button
        onClick={onRetry}
        className="text-[12px] font-semibold text-red-600 dark:text-red-400 hover:underline shrink-0"
      >
        Retry
      </button>
    </div>
  );
}

// ─── RECENT INCIDENTS COLUMNS ─────────────────────────────────────────────────

const recentColumns: Column<Incident>[] = [
  {
    key: "id",
    label: "ID",
    render: (row) => (
      <span className="font-mono text-[12px] font-bold text-blue-600 dark:text-blue-400">
        {row.id}
      </span>
    ),
  },
  {
    key: "title",
    label: "Title",
    render: (row) => (
      <span className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
        {row.title}
      </span>
    ),
  },
  {
    key: "priority",
    label: "Priority",
    render: (row) => <PriorityBadge value={row.priority} size="sm" />,
  },
  {
    key: "status",
    label: "Status",
    render: (row) => <StatusBadge value={row.status} size="sm" />,
  },
  {
    key: "created_at",
    label: "Created",
    render: (row) => (
      <span className="text-[12px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
        {formatRelative(row.created_at)}
      </span>
    ),
  },
];

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [incResult, assetResult] = await Promise.all([
        incidentsApi.list({ limit: 100 }),
        assetsApi.list({ limit: 100 }),
      ]);
      setIncidents(incResult.items);
      setAssets(assetResult.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Derived values ──
  const openIncidents = incidents.filter((i) => i.status === "open");
  const p1Incidents = incidents.filter((i) => i.priority === "P1");
  const resolvedIncidents = incidents.filter(
    (i) => i.status === "resolved" || i.status === "closed"
  );

  // SLA at risk: open/in-progress, breaching within 120 min
  const slaAtRisk = incidents
    .filter(
      (i) =>
        i.status !== "resolved" &&
        i.status !== "closed" &&
        minutesUntilBreach(i.sla_breach_at) < 120
    )
    .sort(
      (a, b) =>
        new Date(a.sla_breach_at).getTime() - new Date(b.sla_breach_at).getTime()
    );

  // Recent 5 incidents by updated_at
  const recentIncidents = [...incidents]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .slice(0, 5);

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1400px] mx-auto">

      {/* ── Page heading ── */}
      <div>
        <h2 className="text-[13px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
          Overview
        </h2>
        <p className="text-[13px] text-slate-500 dark:text-slate-400">
          Real-time summary of your IT service health.
        </p>
      </div>

      {/* ── Error ── */}
      {error && <ErrorBanner message={error} onRetry={load} />}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Incidents"
          value={incidents.length}
          sub={`${resolvedIncidents.length} resolved`}
          icon={ExclamationTriangleIcon}
          iconColor="text-slate-500"
          iconBg="bg-slate-100 dark:bg-slate-800"
          href="/incidents"
          loading={loading}
        />
        <StatCard
          label="Open Incidents"
          value={openIncidents.length}
          sub="Awaiting action"
          icon={ExclamationTriangleIcon}
          iconColor="text-blue-500"
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          href="/incidents?status=open"
          loading={loading}
        />
        <StatCard
          label="P1 — Critical"
          value={p1Incidents.length}
          sub={p1Incidents.filter((i) => i.status !== "resolved" && i.status !== "closed").length + " active"}
          icon={FireIcon}
          iconColor="text-red-500"
          iconBg="bg-red-50 dark:bg-red-900/20"
          href="/incidents?priority=P1"
          loading={loading}
        />
        <StatCard
          label="Total Assets"
          value={assets.length}
          sub={`${assets.filter((a) => a.status === "active").length} active`}
          icon={ServerStackIcon}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          href="/assets"
          loading={loading}
        />
      </div>

      {/* ── SLA at risk ── */}
      {(loading || slaAtRisk.length > 0) && (
        <section
          className="
            bg-white dark:bg-slate-900
            border border-red-200 dark:border-red-900/50
            rounded-xl overflow-hidden
          "
        >
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10">
            <ClockIcon className="w-4 h-4 text-red-500" />
            <h3 className="text-[13px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">
              SLA At Risk
            </h3>
            {!loading && (
              <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-500 text-white">
                {slaAtRisk.length}
              </span>
            )}
          </div>

          <div className="p-4 flex flex-col gap-2">
            {loading ? (
              <LoadingSpinner variant="page" size={24} label="Checking SLA status…" />
            ) : (
              slaAtRisk.map((inc) => (
                <SLABreachRow key={inc.id} incident={inc} />
              ))
            )}
          </div>
        </section>
      )}

      {/* ── No SLA issues ── */}
      {!loading && !error && slaAtRisk.length === 0 && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/40 rounded-xl">
          <CheckCircleIcon className="w-5 h-5 text-green-500 shrink-0" />
          <p className="text-[13px] font-medium text-green-700 dark:text-green-400">
            All SLA targets are on track — no incidents breaching within the next 2 hours.
          </p>
        </div>
      )}

      {/* ── Recent incidents ── */}
      <section
        className="
          bg-white dark:bg-slate-900
          border border-slate-200 dark:border-slate-800
          rounded-xl overflow-hidden
        "
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Recent Activity
          </h3>
          <Link
            href="/incidents"
            className="flex items-center gap-1 text-[12px] font-semibold text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            View all
            <ArrowRightIcon className="w-3 h-3" />
          </Link>
        </div>

        <Table<Incident>
          columns={recentColumns}
          rows={recentIncidents}
          loading={loading}
          skeletonRows={5}
          getRowKey={(row) => row.id}
          onRowClick={(row) => {
            window.location.href = `/incidents/${row.id}`;
          }}
          emptyTitle="No incidents yet"
          emptySubtitle="Create your first incident to get started."
          density="comfortable"
        />
      </section>

      {/* ── By-status breakdown ── */}
      {!loading && incidents.length > 0 && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Priority breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h3 className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
              By Priority
            </h3>
            <div className="flex flex-col gap-3">
              {(["P1", "P2", "P3", "P4"] as const).map((p) => {
                const count = incidents.filter((i) => i.priority === p).length;
                const pct = incidents.length ? (count / incidents.length) * 100 : 0;
                const barColors: Record<string, string> = {
                  P1: "bg-red-400",
                  P2: "bg-orange-400",
                  P3: "bg-yellow-400",
                  P4: "bg-green-400",
                };
                return (
                  <div key={p} className="flex items-center gap-3">
                    <PriorityBadge value={p} size="sm" />
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-[width] duration-700 ${barColors[p]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 w-5 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h3 className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
              By Status
            </h3>
            <div className="flex flex-col gap-3">
              {(["open", "in_progress", "resolved", "closed"] as const).map((s) => {
                const count = incidents.filter((i) => i.status === s).length;
                const pct = incidents.length ? (count / incidents.length) * 100 : 0;
                const barColors: Record<string, string> = {
                  open: "bg-blue-400",
                  in_progress: "bg-violet-400",
                  resolved: "bg-green-400",
                  closed: "bg-slate-300",
                };
                return (
                  <div key={s} className="flex items-center gap-3">
                    <StatusBadge value={s} size="sm" />
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-[width] duration-700 ${barColors[s]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 w-5 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
