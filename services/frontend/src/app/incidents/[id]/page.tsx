// services/frontend/src/app/incidents/[id]/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  UserIcon,
  CheckCircleIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  TagIcon,
  UserPlusIcon,
  ServerStackIcon,
  CalendarDaysIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { incidentsApi } from "@/lib/api";
import { getClaims, getUserId } from "@/lib/auth";
import type {
  Incident,
  IncidentEvent,
  IncidentStatus,
  IncidentPriority,
} from "@/lib/types";
import { PriorityBadge, StatusBadge } from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Modal from "@/components/ui/Modal";

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

function minutesUntilBreach(sla_breach_at: string): number {
  return Math.floor((new Date(sla_breach_at).getTime() - Date.now()) / 60_000);
}

// ─── SLA BANNER ───────────────────────────────────────────────────────────────

function SLABanner({ incident }: { incident: Incident }) {
  if (incident.status === "resolved" || incident.status === "closed") {
    return null;
  }
  const mins = minutesUntilBreach(incident.sla_breach_at);
  const breached = mins <= 0;
  const atRisk = mins <= 120;
  if (!atRisk) return null;

  const h = Math.floor(Math.abs(mins) / 60);
  const m = Math.abs(mins) % 60;
  const countdown = h > 0 ? `${h}h ${m}m` : `${m}m`;

  return (
    <div
      role="alert"
      className={`
        flex items-center gap-3 px-5 py-3 text-[13px] font-medium border-b
        ${
          breached
            ? "bg-red-600 text-white border-red-700"
            : "bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800"
        }
      `}
    >
      <ClockIcon className="w-4 h-4 shrink-0" />
      {breached ? (
        <span>
          <strong>SLA Breached</strong> — this incident exceeded its SLA target
          at {formatDate(incident.sla_breach_at)}.
        </span>
      ) : (
        <span>
          <strong>SLA At Risk</strong> — breach in{" "}
          <strong>{countdown}</strong> at {formatDate(incident.sla_breach_at)}.
        </span>
      )}
    </div>
  );
}

// ─── INFO GRID ────────────────────────────────────────────────────────────────

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
      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
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

// ─── ACTION BUTTONS ───────────────────────────────────────────────────────────

interface ActionBarProps {
  incident: Incident;
  onAssignMe: () => void;
  onResolve: () => void;
  onComment: () => void;
  onStatusChange: (s: IncidentStatus) => void;
  loading: boolean;
}

function ActionBar({
  incident,
  onAssignMe,
  onResolve,
  onComment,
  onStatusChange,
  loading,
}: ActionBarProps) {
  const claims = getClaims();
  const isResolved =
    incident.status === "resolved" || incident.status === "closed";
  const isAlreadyAssignedToMe = incident.assigned_to === claims?.sub;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Add comment — always available unless closed */}
      {incident.status !== "closed" && (
        <button
          onClick={onComment}
          disabled={loading}
          className="
            flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium
            border border-slate-200 dark:border-slate-700
            text-slate-700 dark:text-slate-200
            hover:bg-slate-50 dark:hover:bg-slate-800
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          <ChatBubbleLeftIcon className="w-4 h-4" />
          Add Comment
        </button>
      )}

      {/* Assign to me */}
      {!isResolved && !isAlreadyAssignedToMe && (
        <button
          onClick={onAssignMe}
          disabled={loading}
          className="
            flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium
            border border-slate-200 dark:border-slate-700
            text-slate-700 dark:text-slate-200
            hover:bg-slate-50 dark:hover:bg-slate-800
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          <UserPlusIcon className="w-4 h-4" />
          Assign to Me
        </button>
      )}

      {/* Start progress */}
      {incident.status === "open" && (
        <button
          onClick={() => onStatusChange("in_progress")}
          disabled={loading}
          className="
            flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold
            bg-violet-50 dark:bg-violet-900/20
            border border-violet-300 dark:border-violet-700
            text-violet-700 dark:text-violet-300
            hover:bg-violet-100 dark:hover:bg-violet-900/30
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          <ArrowPathIcon className="w-4 h-4" />
          Start Progress
        </button>
      )}

      {/* Resolve */}
      {!isResolved && (
        <button
          onClick={onResolve}
          disabled={loading}
          className="
            flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold
            bg-green-50 dark:bg-green-900/20
            border border-green-300 dark:border-green-700
            text-green-700 dark:text-green-300
            hover:bg-green-100 dark:hover:bg-green-900/30
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          <CheckCircleIcon className="w-4 h-4" />
          Resolve
        </button>
      )}

      {/* Close (from resolved) */}
      {incident.status === "resolved" && (
        <button
          onClick={() => onStatusChange("closed")}
          disabled={loading}
          className="
            flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium
            border border-slate-200 dark:border-slate-700
            text-slate-600 dark:text-slate-300
            hover:bg-slate-50 dark:hover:bg-slate-800
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          <XMarkIcon className="w-4 h-4" />
          Close Incident
        </button>
      )}

      {loading && <LoadingSpinner variant="inline" size={16} />}
    </div>
  );
}

// ─── RESOLVE MODAL ────────────────────────────────────────────────────────────

function ResolveModal({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  loading: boolean;
}) {
  const [notes, setNotes] = useState("");
  const err = notes.trim().length > 0 && notes.trim().length < 10;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Resolve Incident"
      subtitle="Provide resolution notes for the audit log before closing."
      maxWidth="max-w-lg"
      footer={
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-[13px] font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(notes)}
            disabled={loading || !notes.trim() || err}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <LoadingSpinner variant="inline" size={14} />
            ) : (
              <CheckCircleIcon className="w-4 h-4" />
            )}
            Mark Resolved
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <CheckCircleIcon className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          <p className="text-[13px] text-green-700 dark:text-green-300">
            Resolving this incident will update its status and log the resolution
            for audit purposes.
          </p>
        </div>
        <div>
          <label
            htmlFor="resolve-notes"
            className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Resolution Notes <span className="text-red-500">*</span>
          </label>
          <textarea
            id="resolve-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="Describe the root cause, actions taken, and any preventive measures..."
            disabled={loading}
            className="
              w-full px-3 py-2.5 rounded-lg text-[13px] leading-relaxed
              border border-slate-300 dark:border-slate-600
              bg-white dark:bg-slate-800
              text-slate-900 dark:text-slate-100
              placeholder-slate-400 dark:placeholder-slate-500
              outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
              disabled:opacity-60 resize-y
            "
          />
          {err && (
            <p className="mt-1.5 text-[12px] text-red-500">
              Please provide at least 10 characters.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── EVENT ITEM ───────────────────────────────────────────────────────────────

const eventIconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  comment: ChatBubbleLeftIcon,
  status_change: TagIcon,
  assignment: UserIcon,
  priority_change: ExclamationTriangleIcon,
};

const eventColorMap: Record<string, string> = {
  comment: "bg-blue-500",
  status_change: "bg-violet-500",
  assignment: "bg-green-500",
  priority_change: "bg-orange-500",
};

function actorInitials(actorId: string): string {
  return actorId.replace("user_", "U").slice(0, 2).toUpperCase();
}

function EventDescription({ event }: { event: IncidentEvent }) {
  switch (event.event_type) {
    case "comment":
      return (
        <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {String(event.payload.message ?? "")}
        </p>
      );
    case "status_change":
      return (
        <p className="text-[13px] text-slate-600 dark:text-slate-400">
          Status changed from{" "}
          <StatusBadge value={event.payload.from as IncidentStatus} size="sm" />{" "}
          to{" "}
          <StatusBadge value={event.payload.to as IncidentStatus} size="sm" />
        </p>
      );
    case "assignment": {
      const to = event.payload.to as string | null;
      return (
        <p className="text-[13px] text-slate-600 dark:text-slate-400">
          {to ? (
            <>
              Assigned to <strong className="text-slate-800 dark:text-slate-200">{to}</strong>
            </>
          ) : (
            "Assignment cleared"
          )}
        </p>
      );
    }
    case "priority_change":
      return (
        <p className="text-[13px] text-slate-600 dark:text-slate-400">
          Priority changed from{" "}
          <PriorityBadge value={event.payload.from as IncidentPriority} size="sm" />{" "}
          to{" "}
          <PriorityBadge value={event.payload.to as IncidentPriority} size="sm" />
        </p>
      );
    default:
      return (
        <pre className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded overflow-x-auto">
          {JSON.stringify(event.payload, null, 2)}
        </pre>
      );
  }
}

function EventItem({
  event,
  isLast,
}: {
  event: IncidentEvent;
  isLast: boolean;
}) {
  const Icon = eventIconMap[event.event_type] ?? TagIcon;
  const dotColor = eventColorMap[event.event_type] ?? "bg-slate-400";
  const isComment = event.event_type === "comment";

  return (
    <div className="flex gap-4">
      {/* Left: avatar + connector */}
      <div className="flex flex-col items-center shrink-0">
        <div className="relative">
          {/* Actor avatar */}
          <div className="w-8 h-8 rounded-full bg-slate-700 dark:bg-slate-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            {actorInitials(event.actor_id)}
          </div>
          {/* Event type dot */}
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${dotColor} flex items-center justify-center ring-2 ring-white dark:ring-slate-900`}
          >
            <Icon className="w-2 h-2 text-white" />
          </div>
        </div>
        {/* Connector line */}
        {!isLast && (
          <div className="w-px flex-1 mt-2 bg-slate-200 dark:bg-slate-700" />
        )}
      </div>

      {/* Right: content */}
      <div className={`flex-1 pb-6 ${isLast ? "" : ""}`}>
        {/* Meta row */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">
            {event.actor_id}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {formatRelative(event.created_at)}
          </span>
          <span
            className={`
              text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded
              ${isComment
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              }
            `}
          >
            {event.event_type.replace("_", " ")}
          </span>
        </div>

        {/* Content bubble for comments, plain for system events */}
        {isComment ? (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3">
            <EventDescription event={event} />
          </div>
        ) : (
          <EventDescription event={event} />
        )}
      </div>
    </div>
  );
}

// ─── COMMENT FORM ─────────────────────────────────────────────────────────────

function CommentForm({
  incidentId,
  onPosted,
  visible,
  onHide,
}: {
  incidentId: string;
  onPosted: (event: IncidentEvent) => void;
  visible: boolean;
  onHide: () => void;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [visible]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || loading) return;

    const actorId = getUserId();
    if (!actorId) return;

    setLoading(true);
    setError(null);
    try {
      const evt = await incidentsApi.createEvent(incidentId, {
        event_type: "comment",
        payload: { message: text.trim() },
        actor_id: actorId,
      });
      onPosted(evt);
      setText("");
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment.");
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="border border-blue-200 dark:border-blue-800 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          New Comment
        </label>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => { setText(e.target.value); setError(null); }}
          rows={4}
          placeholder="Add your comment, findings, or next steps..."
          disabled={loading}
          className="
            w-full px-3 py-2.5 rounded-lg text-[13px] leading-relaxed
            border border-slate-300 dark:border-slate-600
            bg-white dark:bg-slate-800
            text-slate-900 dark:text-slate-100
            placeholder-slate-400 dark:placeholder-slate-500
            outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:opacity-60 resize-y
          "
        />
        {error && (
          <p className="flex items-center gap-1.5 text-[12px] text-red-500">
            <ExclamationCircleIcon className="w-3.5 h-3.5" />
            {error}
          </p>
        )}
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onHide}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-lg text-[13px] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="
              flex items-center gap-1.5 px-4 py-1.5 rounded-lg
              text-[13px] font-semibold text-white
              bg-blue-600 hover:bg-blue-700
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {loading ? <LoadingSpinner variant="inline" size={14} /> : <ChatBubbleLeftIcon className="w-3.5 h-3.5" />}
            Post Comment
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [incident, setIncident] = useState<Incident | null>(null);
  const [events, setEvents] = useState<IncidentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResolve, setShowResolve] = useState(false);
  const [showComment, setShowComment] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inc, evts] = await Promise.all([
        incidentsApi.get(id),
        incidentsApi.listEvents(id),
      ]);
      setIncident(inc);
      setEvents(
        [...evts].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load incident."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // ── Actions ──

  async function handleAssignMe() {
    const actorId = getUserId();
    if (!actorId || !incident) return;
    setActionLoading(true);
    try {
      await incidentsApi.assign(id, { assigned_to: actorId });
      const evt = await incidentsApi.createEvent(id, {
        event_type: "assignment",
        payload: { from: incident.assigned_to, to: actorId },
        actor_id: actorId,
      });
      setIncident((prev) => prev ? { ...prev, assigned_to: actorId } : prev);
      setEvents((ev) => [...ev, evt]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStatusChange(status: IncidentStatus) {
    const actorId = getUserId();
    if (!actorId || !incident) return;
    setActionLoading(true);
    try {
      const updated = await incidentsApi.update(id, { status });
      const evt = await incidentsApi.createEvent(id, {
        event_type: "status_change",
        payload: { from: incident.status, to: status },
        actor_id: actorId,
      });
      setIncident(updated);
      setEvents((ev) => [...ev, evt]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResolve(notes: string) {
    const actorId = getUserId();
    if (!actorId) return;
    setActionLoading(true);
    try {
      const updated = await incidentsApi.resolve(id, { resolution_notes: notes });
      const evt = await incidentsApi.createEvent(id, {
        event_type: "status_change",
        payload: { from: incident?.status, to: "resolved", resolution_notes: notes },
        actor_id: actorId,
      });
      setIncident(updated);
      setEvents((ev) => [...ev, evt]);
      setShowResolve(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve.");
    } finally {
      setActionLoading(false);
    }
  }

  // ── Render ──

  if (loading) return <LoadingSpinner variant="page" label="Loading incident…" />;

  if (error && !incident) {
    return (
      <div className="p-6 flex flex-col items-center gap-4 text-center">
        <ExclamationTriangleIcon className="w-10 h-10 text-red-400" />
        <p className="text-[15px] font-semibold text-slate-700 dark:text-slate-200">{error}</p>
        <div className="flex gap-3">
          <button onClick={load} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 transition-colors">
            Retry
          </button>
          <Link href="/incidents" className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Back to Incidents
          </Link>
        </div>
      </div>
    );
  }

  if (!incident) return null;

  return (
    <div className="flex flex-col">
      {/* ── SLA banner ── */}
      <SLABanner incident={incident} />

      <div className="p-6 flex flex-col gap-6 max-w-[960px] mx-auto w-full">

        {/* ── Back ── */}
        <Link
          href="/incidents"
          className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors w-fit"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          All Incidents
        </Link>

        {/* ── Header card ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex flex-col gap-2 min-w-0">
              <span className="font-mono text-[12px] font-bold text-blue-600 dark:text-blue-400">
                {incident.id}
              </span>
              <h2 className="text-[20px] font-bold text-slate-900 dark:text-white leading-snug">
                {incident.title}
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <PriorityBadge value={incident.priority} />
              <StatusBadge value={incident.status} />
            </div>
          </div>

          {incident.description && (
            <p className="mt-4 text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap border-t border-slate-100 dark:border-slate-800 pt-4">
              {incident.description}
            </p>
          )}

          {/* ── Actions ── */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            {error && (
              <p className="mb-3 flex items-center gap-1.5 text-[12px] text-red-500">
                <ExclamationCircleIcon className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
            <ActionBar
              incident={incident}
              onAssignMe={handleAssignMe}
              onResolve={() => setShowResolve(true)}
              onComment={() => setShowComment((v) => !v)}
              onStatusChange={handleStatusChange}
              loading={actionLoading}
            />
          </div>
        </div>

        {/* ── Info grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <MetaItem icon={UserIcon} label="Assigned To">
            {incident.assigned_to ? (
              <span className="font-mono text-[12px]">{incident.assigned_to}</span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 text-[13px]">Unassigned</span>
            )}
          </MetaItem>

          <MetaItem icon={ServerStackIcon} label="Related Asset">
            {incident.related_asset ? (
              <Link
                href={`/assets/${incident.related_asset}`}
                className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-[12px]"
              >
                {incident.related_asset}
              </Link>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 text-[13px]">None</span>
            )}
          </MetaItem>

          <MetaItem icon={CalendarDaysIcon} label="Created">
            <span className="text-[12px]">{formatDate(incident.created_at)}</span>
          </MetaItem>

          <MetaItem icon={CalendarDaysIcon} label="Last Updated">
            <span className="text-[12px]">{formatDate(incident.updated_at)}</span>
          </MetaItem>

          <MetaItem icon={ClockIcon} label="SLA Breach At">
            <span className="text-[12px]">{formatDate(incident.sla_breach_at)}</span>
          </MetaItem>

          {incident.resolved_at && (
            <MetaItem icon={CheckCircleIcon} label="Resolved At">
              <span className="text-[12px] text-green-600 dark:text-green-400">
                {formatDate(incident.resolved_at)}
              </span>
            </MetaItem>
          )}
        </div>

        {/* ── Comment form (inline, toggleable) ── */}
        <CommentForm
          incidentId={id}
          onPosted={(evt) => setEvents((ev) => [...ev, evt])}
          visible={showComment}
          onHide={() => setShowComment(false)}
        />

        {/* ── Timeline ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Activity Timeline
              <span className="ml-2 text-slate-400 dark:text-slate-600 font-normal normal-case">
                ({events.length} event{events.length !== 1 ? "s" : ""})
              </span>
            </h3>
          </div>

          <div className="p-6">
            {events.length === 0 ? (
              <p className="text-[13px] text-slate-400 dark:text-slate-500 text-center py-8">
                No activity yet. Actions and comments will appear here.
              </p>
            ) : (
              <div>
                {events.map((evt, i) => (
                  <EventItem
                    key={evt.id}
                    event={evt}
                    isLast={i === events.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Resolve modal ── */}
      <ResolveModal
        open={showResolve}
        onClose={() => setShowResolve(false)}
        onConfirm={handleResolve}
        loading={actionLoading}
      />
    </div>
  );
}
