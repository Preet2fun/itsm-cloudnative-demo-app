// services/frontend/src/lib/jwt.ts
//
// Decodes the JWT payload without verifying the signature.
// Signature verification happens server-side (Istio RequestAuthentication)
// on every API call — see root CLAUDE.md §3 "Services NEVER re-validate the JWT".

import type { JWTClaims } from "./types";

export function parseJWT(token: string): JWTClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json) as JWTClaims;
  } catch {
    return null;
  }
}

export function isExpired(claims: JWTClaims): boolean {
  return claims.exp * 1000 <= Date.now();
}
