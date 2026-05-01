// services/frontend/src/app/login/page.tsx
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { authApi } from "@/lib/api";
import { setToken, isAuthenticated } from "@/lib/auth";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useEffect } from "react";

// ─── METADATA (overrides root layout title) ───────────────────────────────────
// Can't export from a "use client" file — set in a separate metadata file if needed.
// For now the <title> is set via the document API on mount.

// ─── FORM STATE ───────────────────────────────────────────────────────────────

interface FormState {
  email: string;
  password: string;
  tenant_slug: string;
}

// ─── FIELD ────────────────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  helperText?: string;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
  rightElement?: React.ReactNode;
}

function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  helperText,
  autoComplete,
  disabled,
  required,
  rightElement,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[13px] font-semibold text-slate-700 dark:text-slate-300"
      >
        {label}
        {required && (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          className="
            w-full px-3 py-2.5 rounded-lg text-[14px]
            border border-slate-300 dark:border-slate-600
            bg-white dark:bg-slate-800
            text-slate-900 dark:text-slate-100
            placeholder-slate-400 dark:placeholder-slate-500
            outline-none
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-shadow duration-100
            pr-10
          "
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightElement}
          </div>
        )}
      </div>
      {helperText && (
        <p className="text-[12px] text-slate-400 dark:text-slate-500 leading-relaxed">
          {helperText}
        </p>
      )}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    tenant_slug: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set page title
  useEffect(() => {
    document.title = "Sign In | ITSM Portal";
  }, []);

  // Already authenticated → skip login
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [router]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null); // clear error on any change
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const { email, password, tenant_slug } = form;

    // Basic client-side validation
    if (!email.trim() || !password || !tenant_slug.trim()) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { token } = await authApi.login({
        email: email.trim().toLowerCase(),
        password,
        tenant_slug: tenant_slug.trim().toLowerCase(),
      });

      // Persist token; redirect
      setToken(token);
      router.replace("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        // Provide a friendlier message for 401 / 403
        if (err.message.toLowerCase().includes("401") ||
            err.message.toLowerCase().includes("403") ||
            err.message.toLowerCase().includes("unauthorized") ||
            err.message.toLowerCase().includes("invalid")) {
          setError("Invalid email, password, or tenant slug. Please check your credentials and try again.");
        } else {
          setError(err.message);
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">

        {/* ── Branding ── */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-slate-900 dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-md">
            <BriefcaseIcon className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-center">
            <h1 className="text-[22px] font-extrabold text-slate-900 dark:text-white tracking-tight">
              ITSM Portal
            </h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
              IT Service Management
            </p>
          </div>
        </div>

        {/* ── Card ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-8 py-8">

          <div className="mb-6">
            <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">
              Sign in to your workspace
            </h2>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
              Enter your credentials and workspace identifier to continue.
            </p>
          </div>

          {/* ── Error banner ── */}
          {error && (
            <div
              role="alert"
              className="
                flex items-start gap-2.5 mb-5
                px-3.5 py-3 rounded-lg
                bg-red-50 dark:bg-red-900/20
                border border-red-200 dark:border-red-800
              "
            >
              <ExclamationCircleIcon className="w-4 h-4 text-red-500 shrink-0 mt-px" />
              <p className="text-[13px] text-red-700 dark:text-red-300 leading-snug">
                {error}
              </p>
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

            {/* Tenant slug */}
            <Field
              id="tenant_slug"
              label="Workspace"
              value={form.tenant_slug}
              onChange={(v) => setField("tenant_slug", v)}
              placeholder="e.g. acme"
              autoComplete="organization"
              disabled={loading}
              required
              helperText="Your organisation's unique workspace identifier, provided by your IT administrator."
            />

            {/* Email */}
            <Field
              id="email"
              label="Email address"
              type="email"
              value={form.email}
              onChange={(v) => setField("email", v)}
              placeholder="you@company.com"
              autoComplete="email"
              disabled={loading}
              required
            />

            {/* Password */}
            <Field
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(v) => setField("password", v)}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={loading}
              required
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              }
            />

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="
                mt-2 w-full flex items-center justify-center gap-2
                px-4 py-2.5 rounded-lg
                bg-slate-900 hover:bg-slate-800
                dark:bg-blue-600 dark:hover:bg-blue-500
                text-white text-[14px] font-semibold
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-colors duration-150
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              "
            >
              {loading ? (
                <>
                  <LoadingSpinner variant="inline" size={16} />
                  <span>Signing in…</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* ── Footer note ── */}
        <p className="text-center text-[12px] text-slate-400 dark:text-slate-600 mt-6">
          Having trouble? Contact your IT administrator.
        </p>
      </div>
    </div>
  );
}
