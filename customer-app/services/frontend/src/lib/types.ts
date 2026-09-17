// services/frontend/src/lib/types.ts
//
// Shared identity contract — same issuer, same shared `public.users` table,
// same JWT shape as platform-app's user-service. See root CLAUDE.md §3/§6.

export interface JWTClaims {
  sub: string; // user ID
  email: string;
  role: "admin" | "agent" | "viewer" | "platform_admin" | "platform_analyst";
  tenant_id?: string; // absent for platform staff (cross-tenant)
  exp: number; // Unix timestamp
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  mfa_required: true;
  session_id: string;
}

export interface MfaSendRequest {
  session_id: string;
}

export interface MfaSendResponse {
  status: string;
}

export interface MfaVerifyRequest {
  session_id: string;
  code: string;
}

export interface MfaVerifyResponse {
  token: string;
  expires_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
  };
}
