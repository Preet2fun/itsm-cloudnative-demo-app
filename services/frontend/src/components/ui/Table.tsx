// services/frontend/src/components/ui/Table.tsx
"use client";

import { useState, useCallback } from "react";
import {
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "./LoadingSpinner";
import EmptyState from "./EmptyState";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface Column<T> {
  /** Unique key — must match a key of T if using default sort */
  key: string;
  /** Column header label */
  label: string;
  /** Custom cell renderer. Receives the row; returns ReactNode. */
  render?: (row: T) => React.ReactNode;
  /** Whether this column is sortable. Default: false */
  sortable?: boolean;
  /** Tailwind classes applied to the <th> and <td> */
  className?: string;
  /** Tailwind classes applied only to <th> */
  headerClassName?: string;
  /** Tailwind classes applied only to <td> */
  cellClassName?: string;
}

type SortDir = "asc" | "desc";

interface SortState {
  key: string;
  dir: SortDir;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  /** Called when a row is clicked. If omitted, rows are not interactive. */
  onRowClick?: (row: T) => void;
  /** Key extractor for React reconciliation. Defaults to row index. */
  getRowKey?: (row: T, index: number) => string | number;
  /** Show skeleton rows instead of data */
  loading?: boolean;
  /** Number of skeleton rows to show while loading */
  skeletonRows?: number;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyAction?: React.ReactNode;
  /** "comfortable" (default) | "compact" */
  density?: "comfortable" | "compact";
  className?: string;
}

// ─── SKELETON ROW ─────────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  );
}

// ─── SORT ICON ────────────────────────────────────────────────────────────────

function SortIcon({
  active,
  dir,
}: {
  active: boolean;
  dir: SortDir;
}) {
  if (!active) {
    return (
      <span className="flex flex-col gap-px opacity-30 ml-1">
        <ChevronUpIcon className="w-2.5 h-2.5" />
        <ChevronDownIcon className="w-2.5 h-2.5" />
      </span>
    );
  }
  return dir === "asc" ? (
    <ChevronUpIcon className="w-3.5 h-3.5 ml-1 text-blue-500 shrink-0" />
  ) : (
    <ChevronDownIcon className="w-3.5 h-3.5 ml-1 text-blue-500 shrink-0" />
  );
}

// ─── DEFAULT SORT ─────────────────────────────────────────────────────────────

function defaultSort<T>(rows: T[], key: string, dir: SortDir): T[] {
  return [...rows].sort((a, b) => {
    const av = (a as Record<string, unknown>)[key];
    const bv = (b as Record<string, unknown>)[key];

    // Null / undefined always last
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;

    let cmp = 0;
    if (typeof av === "string" && typeof bv === "string") {
      cmp = av.localeCompare(bv);
    } else if (typeof av === "number" && typeof bv === "number") {
      cmp = av - bv;
    } else {
      cmp = String(av).localeCompare(String(bv));
    }

    return dir === "asc" ? cmp : -cmp;
  });
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function Table<T>({
  columns,
  rows,
  onRowClick,
  getRowKey,
  loading = false,
  skeletonRows = 6,
  emptyTitle = "No records found",
  emptySubtitle,
  emptyAction,
  density = "comfortable",
  className = "",
}: TableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null);

  const handleSort = useCallback(
    (key: string) => {
      setSort((prev) => {
        if (prev?.key === key) {
          return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
        }
        return { key, dir: "asc" };
      });
    },
    []
  );

  const displayRows =
    sort && !loading ? defaultSort(rows, sort.key, sort.dir) : rows;

  const cellPadding =
    density === "compact" ? "px-3 py-2" : "px-4 py-3.5";
  const headerPadding =
    density === "compact" ? "px-3 py-2" : "px-4 py-3";
  const rowHeight = density === "compact" ? "h-10" : "h-[52px]";

  // ── Loading ──
  if (loading) {
    return (
      <div className={`overflow-x-auto ${className}`}>
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`
                    ${headerPadding} text-left text-[11px] font-semibold
                    text-slate-500 dark:text-slate-400 uppercase tracking-wider
                    whitespace-nowrap ${col.headerClassName ?? col.className ?? ""}
                  `}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: skeletonRows }).map((_, i) => (
              <SkeletonRow key={i} cols={columns.length} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── Empty ──
  if (!rows.length) {
    return (
      <EmptyState
        title={emptyTitle}
        subtitle={emptySubtitle}
        action={emptyAction}
      />
    );
  }

  // ── Data ──
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                className={`
                  ${headerPadding} text-left text-[11px] font-semibold
                  text-slate-500 dark:text-slate-400 uppercase tracking-wider
                  whitespace-nowrap select-none
                  ${col.sortable ? "cursor-pointer hover:text-slate-700 dark:hover:text-slate-200" : ""}
                  ${col.headerClassName ?? col.className ?? ""}
                `}
              >
                <span className="inline-flex items-center">
                  {col.label}
                  {col.sortable && (
                    <SortIcon
                      active={sort?.key === col.key}
                      dir={sort?.key === col.key ? sort.dir : "asc"}
                    />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, index) => {
            const key = getRowKey ? getRowKey(row, index) : index;
            return (
              <tr
                key={key}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`
                  ${rowHeight} border-b border-slate-100 dark:border-slate-800
                  transition-colors duration-75
                  ${
                    onRowClick
                      ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      : ""
                  }
                `}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`
                      ${cellPadding} text-slate-900 dark:text-slate-100
                      align-middle
                      ${col.cellClassName ?? col.className ?? ""}
                    `}
                  >
                    {col.render
                      ? col.render(row)
                      : String(
                          (row as Record<string, unknown>)[col.key] ?? "—"
                        )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
