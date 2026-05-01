// services/frontend/src/app/incidents/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { incidentsApi } from "@/lib/api";
import type { Incident, IncidentPriority, IncidentStatus } from "@/lib/types";
import { PriorityBadge, StatusBadge } from "@/components/ui/Badge";
import Table, { type Column } from "@/components/ui/Table";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const PRIORITIES: IncidentPriority[] = ["P1", "P2", "P3", "P4"];
const STATUSES: { value: IncidentStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

// ─── SLA HELPERS ──────────────────────────────────────────────────────────────

function minutesUntilBreach(sla_breach_at: string): number {
  return Math.floor(
    (new Date(sla_breach_at).getTime() - Date.now()) / 60_000
  );
}

function SLACell({ incident }: { incident: Incident }) {
  if (
    incident.status === "resolved" ||
    incident.status === "closed"
  ) {
    return <span className="text-slate-400 dark:text-slate-600 text-[12px]">—</span>;
  }

  const mins = minutesUntilBreach(incident.sla_breach_at);
  const breached = mins <= 0;
  const atRisk = mins <= 120;

  if (breached) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-600 text-white">
        <ClockIcon className="w-3 h-3" />
        Breached
      </span>
    );
  }

  if (atRisk) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const label = h > 0 ? `${h}h ${m}m` : `${m}m`;
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 ring-1 ring-orange-300 dark:ring-orange-700">
        <ClockIcon className="w-3 h-3" />
        {label}
      </span>
    );
  }

  const h = Math.floor(mins / 60);
  const label = h >= 24 ? `${Math.floor(h / 24)}d` : `${h}h`;
  return (
    <span className="text-[12px] text-slate-500 dark:text-slate-400">
      {label}
    </span>
  );
}

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

// ─── FILTER BAR ───────────────────────────────────────────────────────────────

interface Filters {
  priority: IncidentPriority | "";
  status: IncidentStatus | "";
  search: string;
}

interface FilterBarProps {
  filters: Filters;
  onChange: (f: Filters) => void;
  total: number;
  loading: boolean;
}

function FilterBar({ filters, onChange, total, loading }: FilterBarProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const hasActive =
    filters.priority !== "" ||
    filters.status !== "" ||
    filters.search !== "";

  function clear() {
    onChange({ priority: "", status: "", search: "" });
    searchRef.current?.focus();
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-[320px]">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          ref={searchRef}
          type="search"
          value={filters.search}
          onChange={(e) =>
            onChange({ ...filters, search: e.target.value })
          }
          placeholder="Search by title or ID…"
          className="
            w-full pl-9 pr-3 py-2 rounded-lg text-[13px]
            border border-slate-200 dark:border-slate-700
            bg-slate-50 dark:bg-slate-800
            text-slate-900 dark:text-slate-100
            placeholder-slate-400 dark:placeholder-slate-500
            outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-shadow
          "
        />
      </div>

      {/* Priority filter */}
      <div className="flex items-center gap-1.5">
        <FunnelIcon className="w-3.5 h-3.5 text-slate-400" />
        <select
          value={filters.priority}
          onChange={(e) =>
            onChange({
              ...filters,
              priority: e.target.value as IncidentPriority | "",
            })
          }
          className="
            py-2 pl-2.5 pr-7 rounded-lg text-[13px]
            border border-slate-200 dark:border-slate-700
            bg-slate-50 dark:bg-slate-800
            text-slate-700 dark:text-slate-200
            outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer
          "
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={(e) =>
          onChange({
            ...filters,
            status: e.target.value as IncidentStatus | "",
          })
        }
        className="
          py-2 pl-2.5 pr-7 rounded-lg text-[13px]
          border border-slate-200 dark:border-slate-700
          bg-slate-50 dark:bg-slate-800
          text-slate-700 dark:text-slate-200
          outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer
        "
      >
        <option value="">All Statuses</option>
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Clear filters */}
      {hasActive && (
        <button
          onClick={clear}
          className="flex items-center gap-1 text-[12px] font-medium text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          <XMarkIcon className="w-3.5 h-3.5" />
          Clear
        </button>
      )}

      {/* Count */}
      <div className="ml-auto flex items-center gap-3">
        {loading ? (
          <LoadingSpinner variant="inline" size={14} />
        ) : (
          <span className="text-[12px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
            {total} incident{total !== 1 ? "s" : ""}
          </span>
        )}

        {/* New Incident */}
        <Link
          href="/incidents/new"
          className="
            flex items-center gap-1.5 px-3.5 py-2 rounded-lg
            bg-blue-600 hover:bg-blue-700
            text-white text-[13px] font-semibold
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          "
        >
          <PlusIcon className="w-4 h-4" />
          New Incident
        </Link>
      </div>
    </div>
  );
}

// ─── PAGINATION ───────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}

function Pagination({ page, pageSize, total, onPage }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = Math.min((page - 1) * pageSize + 1, total);
  const to = Math.min(page * pageSize, total);

  // Build page numbers with ellipsis
  function pageNumbers(): (number | "…")[] {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4)
      return [1, 2, 3, 4, 5, "…", totalPages];
    if (page >= totalPages - 3)
      return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", page - 1, page, page + 1, "…", totalPages];
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
      <span className="text-[12px] text-slate-400 dark:text-slate-500">
        Showing {from}–{to} of {total}
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="
            flex items-center justify-center w-7 h-7 rounded
            text-slate-400 hover:text-slate-700 dark:hover:text-slate-200
            hover:bg-slate-100 dark:hover:bg-slate-800
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-colors
          "
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>

        {pageNumbers().map((n, i) =>
          n === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="w-7 text-center text-[12px] text-slate-400"
            >
              …
            </span>
          ) : (
            <button
              key={n}
              onClick={() => onPage(n as number)}
              className={`
                w-7 h-7 rounded text-[12px] font-medium transition-colors
                ${
                  n === page
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }
              `}
            >
              {n}
            </button>
          )
        )}

        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="
            flex items-center justify-center w-7 h-7 rounded
            text-slate-400 hover:text-slate-700 dark:hover:text-slate-200
            hover:bg-slate-100 dark:hover:bg-slate-800
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-colors
          "
          aria-label="Next page"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── TABLE COLUMNS ────────────────────────────────────────────────────────────

function buildColumns(): Column<Incident>[] {
  return [
    {
      key: "id",
      label: "ID",
      sortable: false,
      render: (row) => (
        <span className="font-mono text-[12px] font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
          {row.id}
        </span>
      ),
    },
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
            {row.title}
          </span>
          {row.assigned_to && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Assigned: {row.assigned_to}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      render: (row) => <PriorityBadge value={row.priority} />,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => <StatusBadge value={row.status} />,
    },
    {
      key: "sla_breach_at",
      label: "SLA",
      sortable: true,
      render: (row) => <SLACell incident={row} />,
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      render: (row) => (
        <span className="text-[12px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
          {formatRelative(row.created_at)}
        </span>
      ),
    },
  ];
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function IncidentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Initialise from URL search params (supports direct links)
  const [filters, setFilters] = useState<Filters>({
    priority: (searchParams.get("priority") as IncidentPriority) || "",
    status: (searchParams.get("status") as IncidentStatus) || "",
    search: searchParams.get("q") || "",
  });
  const [page, setPage] = useState(1);
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns = buildColumns();

  // ── Fetch ──
  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Parameters<typeof incidentsApi.list>[0] = {
        limit: 200, // fetch a generous page server-side; we paginate client-side
        offset: 0,
      };
      if (filters.priority) params.priority = filters.priority;
      if (filters.status) params.status = filters.status;

      const result = await incidentsApi.list(params);
      setAllIncidents(result.items);
      setPage(1); // reset to page 1 on new fetch
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load incidents."
      );
    } finally {
      setLoading(false);
    }
  }, [filters.priority, filters.status]);

  // Refetch when server-side filters change
  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Sync filter changes to URL (for shareability)
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.priority) params.set("priority", filters.priority);
    if (filters.status) params.set("status", filters.status);
    if (filters.search) params.set("q", filters.search);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [filters, pathname, router]);

  // ── Client-side search + pagination ──
  const searched = filters.search.trim()
    ? allIncidents.filter(
        (i) =>
          i.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          i.id.toLowerCase().includes(filters.search.toLowerCase()) ||
          (i.description ?? "")
            .toLowerCase()
            .includes(filters.search.toLowerCase())
      )
    : allIncidents;

  const total = searched.length;
  const pagedRows = searched.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  function handleFiltersChange(f: Filters) {
    setFilters(f);
    setPage(1);
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Filter bar ── */}
      <FilterBar
        filters={filters}
        onChange={handleFiltersChange}
        total={total}
        loading={loading}
      />

      {/* ── Error ── */}
      {error && (
        <div className="mx-5 mt-4 flex items-center justify-between gap-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-[13px]">
          <span className="text-red-700 dark:text-red-300">{error}</span>
          <button
            onClick={fetchIncidents}
            className="text-[12px] font-semibold text-red-600 dark:text-red-400 hover:underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-900">
        <Table<Incident>
          columns={columns}
          rows={pagedRows}
          loading={loading}
          skeletonRows={PAGE_SIZE}
          getRowKey={(row) => row.id}
          onRowClick={(row) => router.push(`/incidents/${row.id}`)}
          emptyTitle="No incidents found"
          emptySubtitle={
            filters.priority || filters.status || filters.search
              ? "Try adjusting your filters or clearing the search."
              : "Create your first incident to get started."
          }
          emptyAction={
            !filters.priority && !filters.status && !filters.search ? (
              <Link
                href="/incidents/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                New Incident
              </Link>
            ) : undefined
          }
          density="comfortable"
        />
      </div>

      {/* ── Pagination ── */}
      {!loading && total > PAGE_SIZE && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPage={setPage}
        />
      )}
    </div>
  );
}
