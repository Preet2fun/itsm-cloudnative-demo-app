// services/frontend/src/components/ui/Badge.tsx

import type {
  IncidentPriority,
  IncidentStatus,
  AssetType,
  AssetStatus,
} from "@/lib/types";

// ─── VARIANT CONFIG ───────────────────────────────────────────────────────────

const priorityConfig: Record<
  IncidentPriority,
  { label: string; className: string }
> = {
  P1: {
    label: "P1 — Critical",
    className:
      "bg-red-50 text-red-800 ring-red-300 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-700",
  },
  P2: {
    label: "P2 — High",
    className:
      "bg-orange-50 text-orange-800 ring-orange-300 dark:bg-orange-900/20 dark:text-orange-300 dark:ring-orange-700",
  },
  P3: {
    label: "P3 — Medium",
    className:
      "bg-yellow-50 text-yellow-800 ring-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:ring-yellow-700",
  },
  P4: {
    label: "P4 — Low",
    className:
      "bg-green-50 text-green-800 ring-green-300 dark:bg-green-900/20 dark:text-green-300 dark:ring-green-700",
  },
};

const statusConfig: Record<
  IncidentStatus,
  { label: string; className: string }
> = {
  open: {
    label: "Open",
    className:
      "bg-blue-50 text-blue-800 ring-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-700",
  },
  in_progress: {
    label: "In Progress",
    className:
      "bg-violet-50 text-violet-800 ring-violet-300 dark:bg-violet-900/20 dark:text-violet-300 dark:ring-violet-700",
  },
  resolved: {
    label: "Resolved",
    className:
      "bg-green-50 text-green-800 ring-green-300 dark:bg-green-900/20 dark:text-green-300 dark:ring-green-700",
  },
  closed: {
    label: "Closed",
    className:
      "bg-slate-100 text-slate-600 ring-slate-300 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600",
  },
};

const assetTypeConfig: Record<AssetType, { label: string; className: string }> =
  {
    hardware: {
      label: "Hardware",
      className:
        "bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600",
    },
    software: {
      label: "Software",
      className:
        "bg-indigo-50 text-indigo-800 ring-indigo-300 dark:bg-indigo-900/20 dark:text-indigo-300 dark:ring-indigo-700",
    },
    network: {
      label: "Network",
      className:
        "bg-cyan-50 text-cyan-800 ring-cyan-300 dark:bg-cyan-900/20 dark:text-cyan-300 dark:ring-cyan-700",
    },
    service: {
      label: "Service",
      className:
        "bg-emerald-50 text-emerald-800 ring-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-700",
    },
  };

const assetStatusConfig: Record<
  AssetStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className:
      "bg-green-50 text-green-800 ring-green-300 dark:bg-green-900/20 dark:text-green-300 dark:ring-green-700",
  },
  inactive: {
    label: "Inactive",
    className:
      "bg-slate-100 text-slate-600 ring-slate-300 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600",
  },
  maintenance: {
    label: "Maintenance",
    className:
      "bg-yellow-50 text-yellow-800 ring-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:ring-yellow-700",
  },
  retired: {
    label: "Retired",
    className:
      "bg-red-50 text-red-800 ring-red-300 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-700",
  },
};

// ─── SIZE ─────────────────────────────────────────────────────────────────────

const sizeClasses = {
  sm: "px-1.5 py-px text-[11px]",
  md: "px-2 py-0.5 text-[12px]",
};

// ─── PROPS ────────────────────────────────────────────────────────────────────

type BadgeVariant =
  | { variant: "priority"; value: IncidentPriority }
  | { variant: "status"; value: IncidentStatus }
  | { variant: "assetType"; value: AssetType }
  | { variant: "assetStatus"; value: AssetStatus };

type BadgeProps = BadgeVariant & {
  size?: "sm" | "md";
  className?: string;
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function Badge({
  variant,
  value,
  size = "md",
  className = "",
}: BadgeProps) {
  let label: string;
  let variantClass: string;

  switch (variant) {
    case "priority": {
      const cfg = priorityConfig[value];
      label = cfg.label;
      variantClass = cfg.className;
      break;
    }
    case "status": {
      const cfg = statusConfig[value];
      label = cfg.label;
      variantClass = cfg.className;
      break;
    }
    case "assetType": {
      const cfg = assetTypeConfig[value];
      label = cfg.label;
      variantClass = cfg.className;
      break;
    }
    case "assetStatus": {
      const cfg = assetStatusConfig[value];
      label = cfg.label;
      variantClass = cfg.className;
      break;
    }
  }

  return (
    <span
      className={`
        inline-flex items-center rounded font-semibold
        ring-1 ring-inset leading-none whitespace-nowrap
        ${sizeClasses[size]}
        ${variantClass}
        ${className}
      `}
    >
      {label}
    </span>
  );
}

// ─── NAMED EXPORTS FOR CONVENIENCE ───────────────────────────────────────────

export function PriorityBadge({
  value,
  size,
}: {
  value: IncidentPriority;
  size?: "sm" | "md";
}) {
  return <Badge variant="priority" value={value} size={size} />;
}

export function StatusBadge({
  value,
  size,
}: {
  value: IncidentStatus;
  size?: "sm" | "md";
}) {
  return <Badge variant="status" value={value} size={size} />;
}

export function AssetTypeBadge({
  value,
  size,
}: {
  value: AssetType;
  size?: "sm" | "md";
}) {
  return <Badge variant="assetType" value={value} size={size} />;
}

export function AssetStatusBadge({
  value,
  size,
}: {
  value: AssetStatus;
  size?: "sm" | "md";
}) {
  return <Badge variant="assetStatus" value={value} size={size} />;
}
