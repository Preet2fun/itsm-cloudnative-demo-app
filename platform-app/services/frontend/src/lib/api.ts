// services/frontend/src/lib/api.ts
//
// Centralised API client for the ITSM frontend.
// All fetch() calls live here — no fetch() in page components.
//
// Every non-auth request:
//   • sends  Authorization: Bearer <token>
//   • sends  X-Tenant-ID: <tenant_id from JWT>
//   • redirects to /login on 401

import { getToken, getTenantId, logout } from "./auth";
import type {
  LoginRequest,
  LoginResponse,
  MfaSendRequest,
  MfaSendResponse,
  MfaVerifyRequest,
  MfaVerifyResponse,
  RefreshRequest,
  RefreshResponse,
  Incident,
  IncidentEvent,
  IncidentListParams,
  CreateIncidentRequest,
  UpdateIncidentRequest,
  AssignIncidentRequest,
  ResolveIncidentRequest,
  CreateIncidentEventRequest,
  Asset,
  AssetListParams,
  CreateAssetRequest,
  UpdateAssetRequest,
  PaginatedResponse,
} from "./types";

// ─── BASE URL ─────────────────────────────────────────────────────────────────

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
  params?: Record<string, string | number | undefined>;
  /** Pass true for auth endpoints that don't need the Authorization header */
  public?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, params, public: isPublic = false } = opts;

  // Build URL with optional query string.
  // NOTE: paths are relative (e.g. "/api/v1/auth/login") — Istio IngressGateway
  // routes them, so we never have an absolute base to hand to `new URL()`.
  // Build the query string with URLSearchParams instead of a URL object.
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        searchParams.set(k, String(v));
      }
    });
  }
  const queryString = searchParams.toString();
  const url = `${BASE_URL}${path}${queryString ? `?${queryString}` : ""}`;

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  if (!isPublic) {
    const token = getToken();
    const tenantId = getTenantId();

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (tenantId) {
      headers["X-Tenant-ID"] = tenantId;
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  // Handle 401 on authenticated requests — clear local session and redirect
  // to login. Public endpoints (login, mfa/send, mfa/verify, refresh) have no
  // session to invalidate and can return 401 for endpoint-specific reasons
  // (bad credentials, bad OTP code) — those fall through to normal error
  // parsing below so callers get the real server message.
  if (response.status === 401 && !isPublic) {
    logout();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError(401, "Unauthorized — redirecting to login");
  }

  // Parse error responses
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let code: string | undefined;
    try {
      const errorBody = await response.json();
      // User Service's writeError() emits { "error": "<message>" };
      // message/detail are kept for compatibility with other services.
      message = errorBody.message ?? errorBody.detail ?? errorBody.error ?? message;
      code = errorBody.code;
    } catch {
      // non-JSON error body — use the default message
    }
    throw new ApiError(response.status, message, code);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/login
// POST /api/v1/auth/refresh

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
   * stores it via setToken().
   */
  mfaVerify(body: MfaVerifyRequest): Promise<MfaVerifyResponse> {
    return request<MfaVerifyResponse>("/api/v1/auth/mfa/verify", {
      method: "POST",
      body,
      public: true,
    });
  },

  /**
   * Exchange an expiring token for a fresh one.
   * Returns { token } — caller stores it via setToken().
   */
  refresh(body: RefreshRequest): Promise<RefreshResponse> {
    return request<RefreshResponse>("/api/v1/auth/refresh", {
      method: "POST",
      body,
      public: true,
    });
  },
};

// ─── INCIDENTS ────────────────────────────────────────────────────────────────
// GET    /api/v1/incidents
// POST   /api/v1/incidents
// GET    /api/v1/incidents/{id}
// PUT    /api/v1/incidents/{id}
// POST   /api/v1/incidents/{id}/assign
// POST   /api/v1/incidents/{id}/resolve
// GET    /api/v1/incidents/{id}/events
// POST   /api/v1/incidents/{id}/events

export const incidentsApi = {
  /**
   * List incidents with optional filters and pagination.
   */
  list(params?: IncidentListParams): Promise<PaginatedResponse<Incident>> {
    return request<PaginatedResponse<Incident>>("/api/v1/incidents", {
      params: params as Record<string, string | number | undefined>,
    });
  },

  /**
   * Create a new incident.
   */
  create(body: CreateIncidentRequest): Promise<Incident> {
    return request<Incident>("/api/v1/incidents", {
      method: "POST",
      body,
    });
  },

  /**
   * Fetch a single incident by ID.
   */
  get(id: string): Promise<Incident> {
    return request<Incident>(`/api/v1/incidents/${id}`);
  },

  /**
   * Update an existing incident (partial update — send only changed fields).
   */
  update(id: string, body: UpdateIncidentRequest): Promise<Incident> {
    return request<Incident>(`/api/v1/incidents/${id}`, {
      method: "PUT",
      body,
    });
  },

  /**
   * Assign an incident to a user.
   */
  assign(id: string, body: AssignIncidentRequest): Promise<Incident> {
    return request<Incident>(`/api/v1/incidents/${id}/assign`, {
      method: "POST",
      body,
    });
  },

  /**
   * Mark an incident as resolved with resolution notes.
   */
  resolve(id: string, body: ResolveIncidentRequest): Promise<Incident> {
    return request<Incident>(`/api/v1/incidents/${id}/resolve`, {
      method: "POST",
      body,
    });
  },

  /**
   * Fetch the event / activity timeline for an incident.
   */
  listEvents(id: string): Promise<IncidentEvent[]> {
    return request<IncidentEvent[]>(`/api/v1/incidents/${id}/events`);
  },

  /**
   * Append a new event to an incident's timeline
   * (comment, status_change, assignment, priority_change).
   */
  createEvent(
    id: string,
    body: CreateIncidentEventRequest
  ): Promise<IncidentEvent> {
    return request<IncidentEvent>(`/api/v1/incidents/${id}/events`, {
      method: "POST",
      body,
    });
  },
};

// ─── ASSETS ───────────────────────────────────────────────────────────────────
// GET    /api/v1/assets
// POST   /api/v1/assets
// GET    /api/v1/assets/{id}
// PUT    /api/v1/assets/{id}
// GET    /api/v1/assets/{id}/incidents

export const assetsApi = {
  /**
   * List assets with optional filters and pagination.
   */
  list(params?: AssetListParams): Promise<PaginatedResponse<Asset>> {
    return request<PaginatedResponse<Asset>>("/api/v1/assets", {
      params: params as Record<string, string | number | undefined>,
    });
  },

  /**
   * Create a new asset record.
   */
  create(body: CreateAssetRequest): Promise<Asset> {
    return request<Asset>("/api/v1/assets", {
      method: "POST",
      body,
    });
  },

  /**
   * Fetch a single asset by ID.
   */
  get(id: string): Promise<Asset> {
    return request<Asset>(`/api/v1/assets/${id}`);
  },

  /**
   * Update an existing asset (partial update).
   */
  update(id: string, body: UpdateAssetRequest): Promise<Asset> {
    return request<Asset>(`/api/v1/assets/${id}`, {
      method: "PUT",
      body,
    });
  },

  /**
   * Fetch all incidents linked to a specific asset.
   */
  listIncidents(id: string): Promise<Incident[]> {
    return request<Incident[]>(`/api/v1/assets/${id}/incidents`);
  },
};
