// services/frontend/src/components/ui/EmptyState.tsx

import type { ComponentType, SVGProps } from "react";
import {
  ExclamationTriangleIcon,
  ServerStackIcon,
  MagnifyingGlassIcon,
  FolderOpenIcon,
  InboxIcon,
} from "@heroicons/react/24/outline";

// ─── BUILT-IN ICON PRESETS ────────────────────────────────────────────────────

const iconPresets = {
  default: FolderOpenIcon,
  incidents: ExclamationTriangleIcon,
  assets: ServerStackIcon,
  search: MagnifyingGlassIcon,
  inbox: InboxIcon,
} as const;

type IconPreset = keyof typeof iconPresets;

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  /** Short heading — e.g. "No incidents found" */
  title: string;
  /** Longer description — e.g. "Try adjusting your filters." */
  subtitle?: string;
  /**
   * Icon to display.
   * Pass a preset name ("incidents", "assets", "search", "inbox")
   * or a Heroicon component (any SVGProps-compatible icon).
   * Defaults to "default" (folder icon).
   */
  icon?: IconPreset | ComponentType<SVGProps<SVGSVGElement>>;
  /**
   * Optional CTA rendered below the description.
   * Typically a <Button> or <Link> component.
   */
  action?: React.ReactNode;
  className?: string;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function EmptyState({
  title,
  subtitle,
  icon = "default",
  action,
  className = "",
}: EmptyStateProps) {
  // Resolve icon component
  const IconComponent: ComponentType<SVGProps<SVGSVGElement>> =
    typeof icon === "string" ? iconPresets[icon] ?? iconPresets.default : icon;

  return (
    <div
      className={`
        flex flex-col items-center justify-center
        py-16 px-6 text-center
        ${className}
      `}
    >
      {/* Icon container */}
      <div
        className="
          w-14 h-14 rounded-2xl
          bg-slate-100 dark:bg-slate-800
          flex items-center justify-center
          mb-4 shrink-0
        "
      >
        <IconComponent
          className="w-7 h-7 text-slate-400 dark:text-slate-500"
          aria-hidden="true"
        />
      </div>

      {/* Title */}
      <p className="text-[15px] font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
        {title}
      </p>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-[13px] text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
          {subtitle}
        </p>
      )}

      {/* CTA */}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
