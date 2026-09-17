// services/frontend/src/lib/api.ts
//
// Centralised API client. All fetch() calls live here — no fetch() in
// page components.
//
// Every non-auth request would send Authorization + X-Tenant-ID (Envoy
// derives the real X-Tenant-ID from the validated JWT regardless of what a
// client sends — see root CLAUDE.md §3). Auth endpoints below are public:
// no session exists yet to attach either header to.

import { getToken, getTenantId, useSessionStore } from "./session-store";
import type {
  LoginRequest,
  LoginResponse,
  MfaSendRequest,
  MfaSendResponse,
  MfaVerifyRequest,
  MfaVerifyResponse,
} from "./types";

// ─── BASE URL ─────────────────────────────────────────────────────────────────
//
// Paths are relative (e.g. "/api/v1/auth/login") — Istio IngressGateway
// routes them. In dev, vite.config.ts's server.proxy forwards /api to the
// real cluster; in production this is served from behind the same gateway
// as the rest of the app, so BASE_URL stays empty either way.
const BASE_URL = "";

// ─── API ERROR ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── INTERNAL FETCH WRAPPER ───────────────────────────────────────────────────

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Pass true for auth endpoints that don't need the Authorization header */
  public?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, public: isPublic = false } = opts;
  const url = `${BASE_URL}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (!isPublic) {
    const token = getToken();
    const tenantId = getTenantId();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (tenantId) headers["X-Tenant-ID"] = tenantId;
  }

  const response = await fetch(url, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  // Authenticated request rejected — clear the session and bounce to login.
  // Public endpoints (login, mfa/send, mfa/verify) have no session to
  // invalidate and can return 401 for endpoint-specific reasons (bad
  // credentials, bad code) — those fall through to normal error parsing.
  if (response.status === 401 && !isPublic) {
    useSessionStore.getState().clear();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError(401, "Unauthorized — redirecting to login");
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let code: string | undefined;
    try {
      const errorBody = await response.json();
      message = errorBody.message ?? errorBody.detail ?? errorBody.error ?? message;
      code = errorBody.code;
    } catch {
      // non-JSON error body — use the default message
    }
    throw new ApiError(response.status, message, code);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/login
// POST /api/v1/auth/mfa/send
// POST /api/v1/auth/mfa/verify

export const authApi = {
  /**
   * Start a login — validates credentials, returns an MFA session to
   * complete via mfaSend() + mfaVerify(). Does NOT return a usable token.
   */
  login(body: LoginRequest): Promise<LoginResponse> {
    return request<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body,
      public: true,
    });
  },

  /**
   * Trigger sending (or, in dev mode, server-side logging) of the email OTP
   * for a pending login session.
   */
  mfaSend(body: MfaSendRequest): Promise<MfaSendResponse> {
    return request<MfaSendResponse>("/api/v1/auth/mfa/send", {
      method: "POST",
      body,
      public: true,
    });
  },

  /**
   * Complete login by submitting the OTP. Returns the real JWT — caller
   * stores it via useSessionStore's completeVerify().
   */
  mfaVerify(body: MfaVerifyRequest): Promise<MfaVerifyResponse> {
    return request<MfaVerifyResponse>("/api/v1/auth/mfa/verify", {
      method: "POST",
      body,
      public: true,
    });
  },
};
