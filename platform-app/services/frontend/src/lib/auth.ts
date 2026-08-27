// services/frontend/src/lib/auth.ts
//
// Client-side JWT helpers.
// Reads the token from localStorage key "itsm_token".
// NOTE: Phase 6 will migrate storage to an httpOnly cookie;
// only this file needs to change at that point.

import type { JWTClaims } from "./types";

const TOKEN_KEY = "itsm_token";

// ─── TOKEN STORAGE ────────────────────────────────────────────────────────────

/**
 * Returns the raw JWT string, or null if not present.
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Persists a new JWT to localStorage.
 */
export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Removes the JWT from localStorage (client-side logout).
 */
export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

// ─── JWT PARSING ──────────────────────────────────────────────────────────────

/**
 * Decodes the JWT payload without verifying the signature.
 * Signature verification happens server-side on every API call.
 */
function parseJWT(token: string): JWTClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // Base64url → Base64 → JSON
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json) as JWTClaims;
  } catch {
    return null;
  }
}

/**
 * Returns decoded JWT claims, or null if no token / malformed.
 */
export function getClaims(): JWTClaims | null {
  const token = getToken();
  if (!token) return null;
  return parseJWT(token);
}

// ─── CLAIM ACCESSORS ──────────────────────────────────────────────────────────

/**
 * Returns the tenant_id from the JWT (e.g. "tenant_acme").
 * Used as the X-Tenant-ID header on every non-auth API call.
 */
export function getTenantId(): string | null {
  return getClaims()?.tenant_id ?? null;
}

/**
 * Returns the authenticated user's role, or null if not logged in.
 */
export function getRole(): JWTClaims["role"] | null {
  return getClaims()?.role ?? null;
}

/**
 * Returns the authenticated user's ID (JWT sub claim), or null.
 */
export function getUserId(): string | null {
  return getClaims()?.sub ?? null;
}

/**
 * Returns the authenticated user's email, or null.
 */
export function getEmail(): string | null {
  return getClaims()?.email ?? null;
}

// ─── SESSION STATE ────────────────────────────────────────────────────────────

/**
 * Returns true if there is a non-expired JWT in storage.
 * Uses the `exp` claim; does NOT make a network call.
 */
export function isAuthenticated(): boolean {
  const claims = getClaims();
  if (!claims) return false;
  // exp is seconds since epoch
  return claims.exp * 1000 > Date.now();
}

/**
 * Role-based access helpers.
 */
export function isAdmin(): boolean {
  return getRole() === "admin";
}

export function isAgent(): boolean {
  const role = getRole();
  return role === "admin" || role === "agent";
}

export function isViewer(): boolean {
  return getRole() === "viewer";
}
