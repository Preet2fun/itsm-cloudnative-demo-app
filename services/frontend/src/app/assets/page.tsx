// services/frontend/src/app/assets/page.tsx
"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ServerStackIcon,
} from "@heroicons/react/24/outline";
import { assetsApi } from "@/lib/api";
import type { Asset, AssetType, AssetStatus } from "@/lib/types";
import {
  AssetTypeBadge,
  AssetStatusBadge,
} from "@/components/ui/Badge";
import Table, { type Column } from "@/components/ui/Table";
import Modal from "@/components/ui/Modal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: "hardware", label: "Hardware" },
  { value: "software", label: "Software" },
  { value: "network", label: "Network" },
  { value: "service", label: "Service" },
];

const ASSET_STATUSES: { value: AssetStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired", label: "Retired" },
];

const PAGE_SIZE = 20;

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

// ─── TABLE COLUMNS ────────────────────────────────────────────────────────────

const COLUMNS: Column<Asset>[] = [
  {
    key: "name",
    label: "Name",
    sortable: true,
    render: (row) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {row.name}
        </span>
        <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
          {row.id}
        </span>
      </div>
    ),
  },
  {
    key: "asset_type",
    label: "Type",
    sortable: true,
    render: (row) => <AssetTypeBadge value={row.asset_type} />,
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (row) => <AssetStatusBadge value={row.status} />,
  },
  {
    key: "location",
    label: "Location",
    sortable: true,
    render: (row) => (
      <span className="text-[13px] text-slate-500 dark:text-slate-400">
        {row.location ?? "—"}
      </span>
    ),
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

// ─── FILTER BAR ───────────────────────────────────────────────────────────────

interface Filters {
  asset_type: AssetType | "";
  status: AssetStatus | "";
  search: string;
}

function FilterBar({
  filters,
  onChange,
  total,
  loading,
  onNew,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  total: number;
  loading: boolean;
  onNew: () => void;
}) {
  const hasActive =
    filters.asset_type !== "" ||
    filters.status !== "" ||
    filters.search !== "";

  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-[300px]">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="search"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search by name or ID…"
          className="
            w-full pl-9 pr-3 py-2 rounded-lg text-[13px]
            border border-slate-200 dark:border-slate-700
            bg-slate-50 dark:bg-slate-800
            text-slate-900 dark:text-slate-100
            placeholder-slate-400 dark:placeholder-slate-500
            outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          "
        />
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-1.5">
        <FunnelIcon className="w-3.5 h-3.5 text-slate-400" />
        <select
          value={filters.asset_type}
          onChange={(e) =>
            onChange({ ...filters, asset_type: e.target.value as AssetType | "" })
          }
          className="
            py-2 pl-2.5 pr-7 rounded-lg text-[13px]
            border border-slate-200 dark:border-slate-700
            bg-slate-50 dark:bg-slate-800
            text-slate-700 dark:text-slate-200
            outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer
          "
        >
          <option value="">All Types</option>
          {ASSET_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={(e) =>
          onChange({ ...filters, status: e.target.value as AssetStatus | "" })
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
        {ASSET_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Clear */}
      {hasActive && (
        <button
          onClick={() => onChange({ asset_type: "", status: "", search: "" })}
          className="flex items-center gap-1 text-[12px] font-medium text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          <XMarkIcon className="w-3.5 h-3.5" />
          Clear
        </button>
      )}

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        {loading ? (
          <LoadingSpinner variant="inline" size={14} />
        ) : (
          <span className="text-[12px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
            {total} asset{total !== 1 ? "s" : ""}
          </span>
        )}
        <button
          onClick={onNew}
          className="
            flex items-center gap-1.5 px-3.5 py-2 rounded-lg
            bg-blue-600 hover:bg-blue-700
            text-white text-[13px] font-semibold
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          "
        >
          <PlusIcon className="w-4 h-4" />
          New Asset
        </button>
      </div>
    </div>
  );
}

// ─── PAGINATION ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  total,
  onPage,
}: {
  page: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = Math.min((page - 1) * PAGE_SIZE + 1, total);
  const to = Math.min(page * PAGE_SIZE, total);

  if (totalPages <= 1) return null;

  function pages(): (number | "…")[] {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
    if (page >= totalPages - 3)
      return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", page - 1, page, page + 1, "…", totalPages];
  }

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
      <span className="text-[12px] text-slate-400 dark:text-slate-500">
        Showing {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="flex items-center justify-center w-7 h-7 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ‹
        </button>
        {pages().map((n, i) =>
          n === "…" ? (
            <span key={`e-${i}`} className="w-7 text-center text-[12px] text-slate-400">…</span>
          ) : (
            <button
              key={n}
              onClick={() => onPage(n as number)}
              className={`w-7 h-7 rounded text-[12px] font-medium transition-colors ${n === page ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            >
              {n}
            </button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="flex items-center justify-center w-7 h-7 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ›
        </button>
      </div>
    </div>
  );
}

// ─── NEW ASSET MODAL ──────────────────────────────────────────────────────────

interface NewAssetForm {
  name: string;
  asset_type: AssetType;
  status: AssetStatus;
  location: string;
}

const inputClass = `
  w-full px-3 py-2.5 rounded-lg text-[13px]
  border border-slate-300 dark:border-slate-600
  bg-white dark:bg-slate-800
  text-slate-900 dark:text-slate-100
  placeholder-slate-400 dark:placeholder-slate-500
  outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
  disabled:opacity-60 disabled:cursor-not-allowed
  transition-shadow
`;

function NewAssetModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (asset: Asset) => void;
}) {
  const [form, setForm] = useState<NewAssetForm>({
    name: "",
    asset_type: "hardware",
    status: "active",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | undefined>();

  function reset() {
    setForm({ name: "", asset_type: "hardware", status: "active", location: "" });
    setError(null);
    setNameError(undefined);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function setField<K extends keyof NewAssetForm>(k: K, v: NewAssetForm[K]) {
    setForm((p) => ({ ...p, [k]: v }));
    if (k === "name") setNameError(undefined);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setNameError("Asset name is required.");
      return;
    }
    if (form.name.trim().length < 3) {
      setNameError("Name must be at least 3 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const asset = await assetsApi.create({
        name: form.name.trim(),
        asset_type: form.asset_type,
        status: form.status,
        location: form.location.trim() || null,
      });
      reset();
      onCreated(asset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create asset.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Asset"
      subtitle="Register a new asset in the CMDB."
      maxWidth="max-w-md"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-[13px] font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            form="new-asset-form"
            type="submit"
            disabled={loading || !form.name.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <LoadingSpinner variant="inline" size={14} />
            ) : (
              <ServerStackIcon className="w-4 h-4" />
            )}
            {loading ? "Creating…" : "Create Asset"}
          </button>
        </div>
      }
    >
      <form id="new-asset-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {error && (
          <div className="px-3.5 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-[13px] text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Asset Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="e.g. Primary PostgreSQL Cluster"
            disabled={loading}
            autoFocus
            className={nameError
              ? inputClass.replace("border-slate-300 dark:border-slate-600", "border-red-400 dark:border-red-600")
              : inputClass}
          />
          {nameError && (
            <p className="mt-1.5 text-[12px] text-red-500">{nameError}</p>
          )}
        </div>

        {/* Type + Status row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Type
            </label>
            <select
              value={form.asset_type}
              onChange={(e) => setField("asset_type", e.target.value as AssetType)}
              disabled={loading}
              className={inputClass + " cursor-pointer"}
            >
              {ASSET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setField("status", e.target.value as AssetStatus)}
              disabled={loading}
              className={inputClass + " cursor-pointer"}
            >
              {ASSET_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Location
            <span className="ml-1.5 text-[11px] font-normal text-slate-400">Optional</span>
          </label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setField("location", e.target.value)}
            placeholder="e.g. us-east-1, Rack B-07 / DC-East"
            disabled={loading}
            className={inputClass}
          />
        </div>
      </form>
    </Modal>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function AssetsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [filters, setFilters] = useState<Filters>({
    asset_type: (searchParams.get("type") as AssetType) || "",
    status: (searchParams.get("status") as AssetStatus) || "",
    search: searchParams.get("q") || "",
  });
  const [page, setPage] = useState(1);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  // ── Fetch ──
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Parameters<typeof assetsApi.list>[0] = { limit: 200, offset: 0 };
      if (filters.asset_type) params.asset_type = filters.asset_type;
      if (filters.status) params.status = filters.status;
      const result = await assetsApi.list(params);
      setAllAssets(result.items);
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assets.");
    } finally {
      setLoading(false);
    }
  }, [filters.asset_type, filters.status]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  // Sync to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.asset_type) params.set("type", filters.asset_type);
    if (filters.status) params.set("status", filters.status);
    if (filters.search) params.set("q", filters.search);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [filters, pathname, router]);

  // ── Client-side search ──
  const searched = filters.search.trim()
    ? allAssets.filter(
        (a) =>
          a.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          a.id.toLowerCase().includes(filters.search.toLowerCase()) ||
          (a.location ?? "").toLowerCase().includes(filters.search.toLowerCase())
      )
    : allAssets;

  const total = searched.length;
  const pagedRows = searched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleFiltersChange(f: Filters) {
    setFilters(f);
    setPage(1);
  }

  function handleCreated(asset: Asset) {
    setShowNew(false);
    // Optimistically prepend then navigate to the new asset
    setAllAssets((prev) => [asset, ...prev]);
    router.push(`/assets/${asset.id}`);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter bar */}
      <FilterBar
        filters={filters}
        onChange={handleFiltersChange}
        total={total}
        loading={loading}
        onNew={() => setShowNew(true)}
      />

      {/* Error */}
      {error && (
        <div className="mx-5 mt-4 flex items-center justify-between gap-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-[13px]">
          <span className="text-red-700 dark:text-red-300">{error}</span>
          <button
            onClick={fetchAssets}
            className="text-[12px] font-semibold text-red-600 dark:text-red-400 hover:underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-900">
        <Table<Asset>
          columns={COLUMNS}
          rows={pagedRows}
          loading={loading}
          skeletonRows={PAGE_SIZE}
          getRowKey={(row) => row.id}
          onRowClick={(row) => router.push(`/assets/${row.id}`)}
          emptyTitle="No assets found"
          emptySubtitle={
            filters.asset_type || filters.status || filters.search
              ? "Try adjusting your filters or clearing the search."
              : "Register your first asset to get started."
          }
          emptyAction={
            !filters.asset_type && !filters.status && !filters.search ? (
              <button
                onClick={() => setShowNew(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                New Asset
              </button>
            ) : undefined
          }
          density="comfortable"
        />
      </div>

      {/* Pagination */}
      {!loading && total > PAGE_SIZE && (
        <Pagination page={page} total={total} onPage={setPage} />
      )}

      {/* New asset modal */}
      <NewAssetModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
