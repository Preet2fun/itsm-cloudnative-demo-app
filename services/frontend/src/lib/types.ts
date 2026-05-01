// services/frontend/src/lib/types.ts

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export interface JWTClaims {
  sub: string;           // user ID
  email: string;
  role: "admin" | "agent" | "viewer";
  tenant_id: string;     // e.g. "tenant_acme"
  exp: number;           // Unix timestamp
}

// ─── AUTH REQUESTS / RESPONSES ────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
  tenant_slug: string;
}

export interface LoginResponse {
  token: string;
}

export interface RefreshRequest {
  token: string;
}

export interface RefreshResponse {
  token: string;
}

// ─── INCIDENT ─────────────────────────────────────────────────────────────────

export type IncidentPriority = "P1" | "P2" | "P3" | "P4";
export type IncidentStatus = "open" | "in_progress" | "resolved" | "closed";

export interface Incident {
  id: string;
  title: string;
  description: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  assigned_to: string | null;    // user ID
  related_asset: string | null;  // asset ID
  sla_breach_at: string;         // ISO 8601 datetime
  created_at: string;            // ISO 8601 datetime
  updated_at: string;            // ISO 8601 datetime
  resolved_at: string | null;    // ISO 8601 datetime
}

export type IncidentEventType =
  | "comment"
  | "status_change"
  | "assignment"
  | "priority_change";

export interface IncidentEvent {
  id: string;
  incident_id: string;
  event_type: IncidentEventType;
  payload: Record<string, unknown>;
  actor_id: string;
  created_at: string;  // ISO 8601 datetime
}

// ─── INCIDENT REQUESTS ────────────────────────────────────────────────────────

export interface CreateIncidentRequest {
  title: string;
  description: string;
  priority: IncidentPriority;
}

export interface UpdateIncidentRequest {
  title?: string;
  description?: string;
  priority?: IncidentPriority;
  status?: IncidentStatus;
  related_asset?: string | null;
}

export interface AssignIncidentRequest {
  assigned_to: string;  // user ID
}

export interface ResolveIncidentRequest {
  resolution_notes: string;
}

export interface CreateIncidentEventRequest {
  event_type: IncidentEventType;
  payload: Record<string, unknown>;
  actor_id: string;
}

// ─── ASSET ────────────────────────────────────────────────────────────────────

export type AssetType = "hardware" | "software" | "network" | "service";
export type AssetStatus = "active" | "inactive" | "maintenance" | "retired";

export interface Asset {
  id: string;
  name: string;
  asset_type: AssetType;
  status: AssetStatus;
  location: string | null;
  asset_metadata: Record<string, unknown>;
  created_at: string;  // ISO 8601 datetime
  updated_at: string;  // ISO 8601 datetime
}

// ─── ASSET REQUESTS ───────────────────────────────────────────────────────────

export interface CreateAssetRequest {
  name: string;
  asset_type: AssetType;
  status: AssetStatus;
  location?: string | null;
}

export interface UpdateAssetRequest {
  name?: string;
  asset_type?: AssetType;
  status?: AssetStatus;
  location?: string | null;
  asset_metadata?: Record<string, unknown>;
}

// ─── PAGINATED RESPONSE ───────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit?: number;
  offset?: number;
}

// ─── LIST QUERY PARAMS ────────────────────────────────────────────────────────

export interface IncidentListParams {
  priority?: IncidentPriority;
  status?: IncidentStatus;
  limit?: number;
  offset?: number;
}

export interface AssetListParams {
  asset_type?: AssetType;
  status?: AssetStatus;
  limit?: number;
  offset?: number;
}

// ─── API ERROR ────────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  code?: string;
  status: number;
}
