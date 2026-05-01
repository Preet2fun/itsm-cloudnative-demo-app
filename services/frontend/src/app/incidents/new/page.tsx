// services/frontend/src/app/incidents/new/page.tsx
"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { incidentsApi } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import type { IncidentPriority } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// ─── PRIORITY OPTION CONFIG ───────────────────────────────────────────────────

const PRIORITY_OPTIONS: {
  value: IncidentPriority;
  label: string;
  description: string;
  ring: string;
  bg: string;
  text: string;
}[] = [
  {
    value: "P1",
    label: "P1 — Critical",
    description: "Complete service outage or severe data loss. Requires immediate response.",
    ring: "ring-red-400 dark:ring-red-600",
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-300",
  },
  {
    value: "P2",
    label: "P2 — High",
    description: "Major feature unavailable or significant performance degradation.",
    ring: "ring-orange-400 dark:ring-orange-600",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    text: "text-orange-700 dark:text-orange-300",
  },
  {
    value: "P3",
    label: "P3 — Medium",
    description: "Partial loss of functionality with a workaround available.",
    ring: "ring-yellow-400 dark:ring-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    text: "text-yellow-700 dark:text-yellow-300",
  },
  {
    value: "P4",
    label: "P4 — Low",
    description: "Minor issue or cosmetic defect. No immediate business impact.",
    ring: "ring-green-400 dark:ring-green-600",
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-700 dark:text-green-300",
  },
];

// ─── FIELD WRAPPER ────────────────────────────────────────────────────────────

function FieldLabel({
  htmlFor,
  label,
  required,
  hint,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 mb-1.5">
      <label
        htmlFor={htmlFor}
        className="text-[13px] font-semibold text-slate-700 dark:text-slate-300"
      >
        {label}
        {required && (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {hint && (
        <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
          {hint}
        </span>
      )}
    </div>
  );
}

const inputClass = `
  w-full px-3 py-2.5 rounded-lg text-[14px]
  border border-slate-300 dark:border-slate-600
  bg-white dark:bg-slate-800
  text-slate-900 dark:text-slate-100
  placeholder-slate-400 dark:placeholder-slate-500
  outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
  disabled:opacity-60 disabled:cursor-not-allowed
  transition-shadow duration-100
`;

const errorInputClass = `
  w-full px-3 py-2.5 rounded-lg text-[14px]
  border border-red-400 dark:border-red-600
  bg-white dark:bg-slate-800
  text-slate-900 dark:text-slate-100
  placeholder-slate-400 dark:placeholder-slate-500
  outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400
  disabled:opacity-60 disabled:cursor-not-allowed
  transition-shadow duration-100
`;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-red-600 dark:text-red-400">
      <ExclamationCircleIcon className="w-3.5 h-3.5 shrink-0" />
      {message}
    </p>
  );
}

// ─── FORM STATE ───────────────────────────────────────────────────────────────

interface FormValues {
  title: string;
  description: string;
  priority: IncidentPriority;
  related_asset: string;
}

interface FieldErrors {
  title?: string;
  description?: string;
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function NewIncidentPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormValues>({
    title: "",
    description: "",
    priority: "P3",
    related_asset: "",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear field-level error on change
    if (key in fieldErrors) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
    setSubmitError(null);
  }

  // ── Validation ──
  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!form.title.trim()) {
      errors.title = "Title is required.";
    } else if (form.title.trim().length < 10) {
      errors.title = "Title must be at least 10 characters.";
    } else if (form.title.trim().length > 200) {
      errors.title = "Title must be 200 characters or fewer.";
    }
    if (!form.description.trim()) {
      errors.description = "Description is required.";
    } else if (form.description.trim().length < 20) {
      errors.description = "Please provide at least 20 characters of detail.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // ── Submit ──
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    setSubmitError(null);

    try {
      const incident = await incidentsApi.create({
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
      });

      // Optionally post a creation event with actor context
      const actorId = getUserId();
      if (actorId) {
        try {
          await incidentsApi.createEvent(incident.id, {
            event_type: "comment",
            payload: {
              message: "Incident created.",
              ...(form.related_asset.trim()
                ? { related_asset_hint: form.related_asset.trim() }
                : {}),
            },
            actor_id: actorId,
          });
        } catch {
          // Non-fatal — creation event is best-effort
        }
      }

      router.push(`/incidents/${incident.id}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to create incident."
      );
      setLoading(false);
    }
  }

  const titleLength = form.title.length;
  const descLength = form.description.length;

  return (
    <div className="p-6 max-w-[720px] mx-auto">

      {/* ── Back nav ── */}
      <div className="mb-6">
        <Link
          href="/incidents"
          className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          Back to Incidents
        </Link>
      </div>

      {/* ── Page header ── */}
      <div className="mb-6">
        <h2 className="text-[20px] font-bold text-slate-900 dark:text-white">
          New Incident
        </h2>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
          Describe the issue clearly so it can be triaged and assigned quickly.
        </p>
      </div>

      {/* ── Submit error ── */}
      {submitError && (
        <div
          role="alert"
          className="
            flex items-start gap-2.5 mb-6
            px-4 py-3 rounded-lg
            bg-red-50 dark:bg-red-900/20
            border border-red-200 dark:border-red-800
          "
        >
          <ExclamationTriangleIcon className="w-4 h-4 text-red-500 shrink-0 mt-px" />
          <p className="text-[13px] text-red-700 dark:text-red-300">{submitError}</p>
        </div>
      )}

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-6">

          {/* Card: Basic info */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-5">
              Basic Information
            </h3>

            {/* Title */}
            <div className="mb-5">
              <FieldLabel
                htmlFor="title"
                label="Title"
                required
                hint={`${titleLength}/200`}
              />
              <input
                id="title"
                type="text"
                value={form.title}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setField("title", e.target.value)
                }
                maxLength={200}
                placeholder="e.g. Production database connection pool exhausted"
                disabled={loading}
                className={fieldErrors.title ? errorInputClass : inputClass}
                aria-describedby={fieldErrors.title ? "title-error" : undefined}
                autoFocus
              />
              <FieldError message={fieldErrors.title} />
            </div>

            {/* Description */}
            <div>
              <FieldLabel
                htmlFor="description"
                label="Description"
                required
                hint={`${descLength} chars`}
              />
              <textarea
                id="description"
                value={form.description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setField("description", e.target.value)
                }
                rows={6}
                placeholder={
                  "Describe the issue in detail:\n" +
                  "• What is the impact and how many users are affected?\n" +
                  "• When did it start?\n" +
                  "• What has already been tried?"
                }
                disabled={loading}
                className={`${fieldErrors.description ? errorInputClass : inputClass} resize-y leading-relaxed`}
                aria-describedby={
                  fieldErrors.description ? "desc-error" : undefined
                }
              />
              <FieldError message={fieldErrors.description} />
            </div>
          </section>

          {/* Card: Priority */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-5">
              Priority
            </h3>
            <div
              role="radiogroup"
              aria-label="Incident priority"
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {PRIORITY_OPTIONS.map((opt) => {
                const selected = form.priority === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`
                      flex items-start gap-3 p-4 rounded-lg border cursor-pointer
                      transition-all duration-100
                      ${
                        selected
                          ? `ring-2 ${opt.ring} border-transparent ${opt.bg}`
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/50"
                      }
                      ${loading ? "opacity-60 cursor-not-allowed" : ""}
                    `}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={opt.value}
                      checked={selected}
                      onChange={() => setField("priority", opt.value)}
                      disabled={loading}
                      className="mt-0.5 accent-blue-600 shrink-0"
                    />
                    <div>
                      <p
                        className={`text-[13px] font-bold ${
                          selected
                            ? opt.text
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {opt.label}
                      </p>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {opt.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Card: Optional fields */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-5">
              Optional
            </h3>

            {/* Related Asset ID */}
            <div>
              <FieldLabel
                htmlFor="related_asset"
                label="Related Asset ID"
                hint="Optional"
              />
              <input
                id="related_asset"
                type="text"
                value={form.related_asset}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setField("related_asset", e.target.value)
                }
                placeholder="e.g. asset_003"
                disabled={loading}
                className={inputClass}
              />
              <p className="mt-1.5 text-[12px] text-slate-400 dark:text-slate-500">
                Link this incident to a known asset from the Assets registry.
                You can also set this after creation.
              </p>
            </div>
          </section>

          {/* ── Actions ── */}
          <div className="flex items-center justify-between gap-4 pt-1 pb-6">
            <Link
              href="/incidents"
              className="
                px-5 py-2.5 rounded-lg text-[13px] font-semibold
                border border-slate-200 dark:border-slate-700
                text-slate-600 dark:text-slate-300
                hover:bg-slate-50 dark:hover:bg-slate-800
                transition-colors duration-150
              "
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="
                flex items-center gap-2 px-6 py-2.5 rounded-lg
                text-[13px] font-semibold text-white
                bg-blue-600 hover:bg-blue-700
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-colors duration-150
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              "
            >
              {loading ? (
                <>
                  <LoadingSpinner variant="inline" size={15} />
                  Creating…
                </>
              ) : (
                <>
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  Create Incident
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
