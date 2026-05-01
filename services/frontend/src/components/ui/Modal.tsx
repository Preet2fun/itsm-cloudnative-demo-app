// services/frontend/src/components/ui/Modal.tsx
"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface ModalProps {
  /** Controls visibility */
  open: boolean;
  /** Called when the user clicks the backdrop or the × button */
  onClose: () => void;
  /** Modal heading */
  title: string;
  /** Optional subtitle / description rendered below the title */
  subtitle?: string;
  /** Modal body content */
  children: ReactNode;
  /**
   * Footer content (e.g. action buttons).
   * Rendered in a sticky footer with a top border.
   * If omitted, no footer is rendered.
   */
  footer?: ReactNode;
  /**
   * Max width of the modal panel.
   * Tailwind max-w-* class — defaults to "max-w-lg" (~512px).
   */
  maxWidth?:
    | "max-w-sm"
    | "max-w-md"
    | "max-w-lg"
    | "max-w-xl"
    | "max-w-2xl"
    | "max-w-3xl";
  /**
   * If true, clicking the backdrop does NOT close the modal.
   * Useful for destructive confirmations.
   */
  disableBackdropClose?: boolean;
  className?: string;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "max-w-lg",
  disableBackdropClose = false,
  className = "",
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Trap focus & handle Escape ──
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Tab trap
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    // Focus the panel so Escape works immediately
    panelRef.current?.focus();

    // Prevent body scroll
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    // Portal-style: fixed overlay covers full viewport
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="
          absolute inset-0
          bg-slate-900/40 dark:bg-slate-900/60
          backdrop-blur-sm
        "
        onClick={disableBackdropClose ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`
          relative flex flex-col w-full ${maxWidth}
          max-h-[90vh]
          bg-white dark:bg-slate-900
          rounded-xl shadow-2xl
          ring-1 ring-black/[0.06] dark:ring-white/[0.08]
          outline-none
          ${className}
        `}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h2
              id="modal-title"
              className="text-[15px] font-bold text-slate-900 dark:text-slate-50 leading-snug"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="
              flex items-center justify-center shrink-0
              w-7 h-7 rounded-lg
              text-slate-400 hover:text-slate-600 dark:hover:text-slate-200
              hover:bg-slate-100 dark:hover:bg-slate-800
              transition-colors duration-100 mt-0.5
            "
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {/* ── Footer (optional) ── */}
        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
