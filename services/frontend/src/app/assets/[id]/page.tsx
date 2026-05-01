// services/frontend/src/app/assets/[id]/page.tsx
"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type FormEvent,
} from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ClockIcon,
  ServerStackIcon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { assetsApi } from "@/lib/api";
import type { Asset, AssetStatus, Incident } from "@/lib/types";
import {
  AssetTypeBadge,
  AssetStatusBadge,
  PriorityBadge,
  StatusBadge,
} from "@/components/ui/Badge";
import Table, { type Column } from "@/components/ui/Table";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const ASSET_STATUSES: { value: AssetStatus; label: string; description: string }[] = [
  { value: "active", label: "Active", description: "Asset is operational and in use" },
  { value: "inactive", label: "Inactive", description: "Asset is powered off or unused" },
  { value: "maintenance", label: "Maintenance", description: "Asset is undergoing maintenance" },
  { value: "retired", label: "Retired", description: "Asset is decommissioned" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

function isValidDate(val: unknown): boolean {
  if (typeof val !== "string") return false;
  const d = new Date(val);
  return !isNaN(d.getTime()) && val.includes("T");
}

function renderMetaValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (isValidDate(val as string)) return formatDate(val as string);
  return String(val);
}

// ─── META ITEM ────────────────────────────────────────────────────────────────

function MetaItem({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {label}
        </span>
        <div className="text-[13px] text-slate-800 dark:text-slate-200 font-medium">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── STATUS DROPDOWN ──────────────────────────────────────────────────────────

function StatusDropdown({
  current,
  onChange,
  loading,
}: {
  current: AssetStatus;
  onChange: (s: AssetStatus) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const statusColors: Record<AssetStatus, string> = {
    active: "text-green-600 dark:text-green-400",
    inactive: "text-slate-500 dark:text-slate-400",
    maintenance: "text-yellow-600 dark:text-yellow-400",
    retired: "text-red-600 dark:text-red-400",
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="
          flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium
          border border-slate-200 dark:border-slate-700
          bg-white dark:bg-slate-900
          text-slate-700 dark:text-slate-200
          hover:bg-slate-50 dark:hover:bg-slate-800
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
      >
        {loading ? (
          <LoadingSpinner variant="inline" size={14} />
        ) : (
          <PencilSquareIcon className="w-4 h-4" />
        )}
        Edit Status
        <ChevronDownIcon
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Change Status
            </p>
          </div>
          {ASSET_STATUSES.map((s) => {
            const isSelected = s.value === current;
            return (
              <button
                key={s.value}
                onClick={() => {
                  if (!isSelected) onChange(s.value);
                  setOpen(false);
                }}
                className={`
                  flex items-start gap-3 w-full px-3 py-2.5 text-left
                  hover:bg-slate-50 dark:hover:bg-slate-800
                  transition-colors
                  ${isSelected ? "bg-slate-50 dark:bg-slate-800/60" : ""}
                `}
              >
                <div className="flex-1">
                  <p className={`text-[13px] font-semibold ${statusColors[s.value]}`}>
                    {s.label}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {s.description}
                  </p>
                </div>
                {isSelected && (
                  <CheckIcon className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── METADATA TABLE ───────────────────────────────────────────────────────────

function MetadataTable({
  metadata,
}: {
  metadata: Record<string, unknown>;
}) {
  const entries = Object.entries(metadata);
  if (entries.length === 0) {
    return (
      <p className="text-[13px] text-slate-400 dark:text-slate-500 px-5 py-4">
        No metadata recorded for this asset.
      </p>
    );
  }

  return (
    <div className="divide-y divide-slate-50 dark:divide-slate-800">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="flex items-center px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
        >
          <span className="w-[200px] shrink-0 text-[12px] font-medium text-slate-500 dark:text-slate-400 capitalize">
            {key.replace(/_/g, " ")}
          </span>
          <span className="font-mono text-[12px] text-slate-800 dark:text-slate-200">
            {renderMetaValue(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── LINKED INCIDENTS COLUMNS ─────────────────────────────────────────────────

const incidentColumns: Column<Incident>[] = [
  {
    key: "id",
    label: "ID",
    sortable: false,
    render: (row) => (
      <span className="font-mono text-[12px] font-bold text-blue-600 dark:text-blue-400">
        {row.id}
      </span>
    ),
  },
  {
    key: "title",
    label: "Title",
    sortable: true,
    render: (row) => (
      <span className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
        {row.title}
      </span>
    ),
  },
  {
    key: "priority",
    label: "Priority",
    sortable: true,
    render: (row) => <PriorityBadge value={row.priority} size="sm" />,
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (row) => <StatusBadge value={row.status} size="sm" />,
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

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function AssetDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, incs] = await Promise.all([
        assetsApi.get(id),
        assetsApi.listIncidents(id),
      ]);
      setAsset(a);
      setIncidents(
        [...incs].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load asset.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // ── Status change ──
  async function handleStatusChange(status: AssetStatus) {
    if (!asset || status === asset.status) return;
    setActionLoading(true);
    setActionError(null);
    setSuccessMsg(null);
    try {
      const updated = await assetsApi.update(id, { status });
      setAsset(updated);
      setSuccessMsg(`Status updated to "${status}".`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update status."
      );
    } finally {
      setActionLoading(false);
    }
  }

  // ── Render states ──
  if (loading) {
    return <LoadingSpinner variant="page" label="Loading asset…" />;
  }

  if (error && !asset) {
    return (
      <div className="p-6 flex flex-col items-center gap-4 text-center">
        <ExclamationTriangleIcon className="w-10 h-10 text-red-400" />
        <p className="text-[15px] font-semibold text-slate-700 dark:text-slate-200">
          {error}
        </p>
        <div className="flex gap-3">
          <button
            onClick={load}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
          <Link
            href="/assets"
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Back to Assets
          </Link>
        </div>
      </div>
    );
  }

  if (!asset) return null;

  const activeIncidents = incidents.filter(
    (i) => i.status !== "resolved" && i.status !== "closed"
  );

  const metaEntries = Object.entries(asset.asset_metadata ?? {});

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[960px] mx-auto w-full">

      {/* ── Back ── */}
      <Link
        href="/assets"
        className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors w-fit"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" />
        All Assets
      </Link>

      {/* ── Header card ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Left: name + badges */}
          <div className="flex flex-col gap-2 min-w-0">
            <span className="font-mono text-[12px] font-bold text-slate-400 dark:text-slate-500">
              {asset.id}
            </span>
            <h2 className="text-[22px] font-bold text-slate-900 dark:text-white leading-snug">
              {asset.name}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <AssetTypeBadge value={asset.asset_type} />
              <AssetStatusBadge value={asset.status} />
              {activeIncidents.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 ring-1 ring-red-300 dark:ring-red-700">
                  <ExclamationTriangleIcon className="w-3 h-3" />
                  {activeIncidents.length} active incident
                  {activeIncidents.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <StatusDropdown
              current={asset.status}
              onChange={handleStatusChange}
              loading={actionLoading}
            />
            {actionError && (
              <p className="text-[12px] text-red-500 flex items-center gap-1">
                <ExclamationTriangleIcon className="w-3 h-3" />
                {actionError}
              </p>
            )}
            {successMsg && (
              <p className="text-[12px] text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckIcon className="w-3 h-3" />
                {successMsg}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Info grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <MetaItem icon={ServerStackIcon} label="Type">
          <AssetTypeBadge value={asset.asset_type} size="sm" />
        </MetaItem>

        <MetaItem icon={MapPinIcon} label="Location">
          {asset.location ? (
            <span>{asset.location}</span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">Not specified</span>
          )}
        </MetaItem>

        <MetaItem icon={CalendarDaysIcon} label="Created">
          <span className="text-[12px]">{formatDate(asset.created_at)}</span>
        </MetaItem>

        <MetaItem icon={ClockIcon} label="Last Updated">
          <span className="text-[12px]">{formatDate(asset.updated_at)}</span>
        </MetaItem>

        <MetaItem icon={ExclamationTriangleIcon} label="Active Incidents">
          <span
            className={`font-bold text-[15px] ${
              activeIncidents.length > 0
                ? "text-red-600 dark:text-red-400"
                : "text-green-600 dark:text-green-400"
            }`}
          >
            {activeIncidents.length}
          </span>
        </MetaItem>

        <MetaItem icon={ServerStackIcon} label="Total Incidents">
          <span className="font-bold text-[15px] text-slate-700 dark:text-slate-200">
            {incidents.length}
          </span>
        </MetaItem>
      </div>

      {/* ── Metadata card ── */}
      {metaEntries.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Metadata
              <span className="ml-2 font-normal normal-case text-slate-400 dark:text-slate-600">
                ({metaEntries.length} field{metaEntries.length !== 1 ? "s" : ""})
              </span>
            </h3>
          </div>
          <MetadataTable metadata={asset.asset_metadata} />
        </section>
      )}

      {/* ── Linked incidents ── */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Linked Incidents
            <span className="ml-2 font-normal normal-case text-slate-400 dark:text-slate-600">
              ({incidents.length} total
              {activeIncidents.length > 0
                ? `, ${activeIncidents.length} active`
                : ""}
              )
            </span>
          </h3>
          {incidents.length > 0 && (
            <Link
              href={`/incidents?q=${asset.id}`}
              className="text-[12px] font-semibold text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              View in Incidents →
            </Link>
          )}
        </div>

        <Table<Incident>
          columns={incidentColumns}
          rows={incidents}
          loading={false}
          getRowKey={(row) => row.id}
          onRowClick={(row) => router.push(`/incidents/${row.id}`)}
          emptyTitle="No linked incidents"
          emptySubtitle="No incidents have been linked to this asset yet."
          density="comfortable"
        />
      </section>
    </div>
  );
}
