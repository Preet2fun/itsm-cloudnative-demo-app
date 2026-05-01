// services/frontend/src/components/ui/LoadingSpinner.tsx

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface LoadingSpinnerProps {
  /**
   * "page"    — vertically centered in a full-height flex container (default for page loads)
   * "inline"  — sized to text, displayed inline-flex (use inside buttons or cells)
   * "overlay" — fixed full-screen semi-transparent overlay (use for form submissions)
   */
  variant?: "page" | "inline" | "overlay";
  /** Spinner diameter. Defaults depend on variant. */
  size?: number;
  /** Optional label rendered below the spinner (not shown for "inline") */
  label?: string;
  className?: string;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function LoadingSpinner({
  variant = "page",
  size,
  label,
  className = "",
}: LoadingSpinnerProps) {
  // Resolve defaults
  const resolvedSize =
    size ?? (variant === "inline" ? 16 : variant === "overlay" ? 40 : 32);

  const strokeWidth = resolvedSize <= 18 ? 2.5 : 2;
  const r = (resolvedSize - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * r;
  // Show ~75% of the circle as the "arc"
  const dashArray = `${circumference * 0.75} ${circumference * 0.25}`;

  const spinnerSvg = (
    <svg
      width={resolvedSize}
      height={resolvedSize}
      viewBox={`0 0 ${resolvedSize} ${resolvedSize}`}
      fill="none"
      className="animate-spin"
      aria-hidden="true"
    >
      {/* Track */}
      <circle
        cx={resolvedSize / 2}
        cy={resolvedSize / 2}
        r={r}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-slate-200 dark:text-slate-700"
      />
      {/* Arc */}
      <circle
        cx={resolvedSize / 2}
        cy={resolvedSize / 2}
        r={r}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={dashArray}
        className="text-blue-500"
      />
    </svg>
  );

  // ── Inline variant ──
  if (variant === "inline") {
    return (
      <span
        role="status"
        aria-label={label ?? "Loading"}
        className={`inline-flex items-center gap-1.5 ${className}`}
      >
        {spinnerSvg}
        {label && (
          <span className="text-[13px] text-slate-500 dark:text-slate-400">
            {label}
          </span>
        )}
      </span>
    );
  }

  // ── Overlay variant ──
  if (variant === "overlay") {
    return (
      <div
        role="status"
        aria-label={label ?? "Loading"}
        className={`
          fixed inset-0 z-50 flex flex-col items-center justify-center
          bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm
          ${className}
        `}
      >
        {spinnerSvg}
        {label && (
          <p className="mt-3 text-[13px] font-medium text-slate-600 dark:text-slate-300">
            {label}
          </p>
        )}
      </div>
    );
  }

  // ── Page variant (default) ──
  return (
    <div
      role="status"
      aria-label={label ?? "Loading"}
      className={`
        flex flex-col items-center justify-center
        w-full min-h-[240px] gap-3
        ${className}
      `}
    >
      {spinnerSvg}
      {label && (
        <p className="text-[13px] text-slate-500 dark:text-slate-400">
          {label}
        </p>
      )}
    </div>
  );
}
