// services/frontend/src/lib/session-store.ts
//
// Session state, in Zustand, persisted — per the design handoff's state
// shape (customer-app/design_handoff/design_handoff_hearth/README.md
// "State shape"): `{ token, sessionId, email }`.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { parseJWT, isExpired } from "./jwt";
import type { JWTClaims } from "./types";

interface SessionState {
  token: string | null;
  sessionId: string | null;
  email: string | null;
  /** Login succeeded, MFA session started — no token yet. */
  startVerify: (session: { sessionId: string; email: string }) => void;
  /** MFA verified — the real JWT. */
  completeVerify: (token: string) => void;
  /** Sign-out, or "use a different account" from the verify screen. */
  clear: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      sessionId: null,
      email: null,
      startVerify: ({ sessionId, email }) =>
        set({ token: null, sessionId, email }),
      completeVerify: (token) => set({ token }),
      clear: () => set({ token: null, sessionId: null, email: null }),
    }),
    { name: "hearth_session" }
  )
);

/** Non-hook accessors — for use outside React (the api.ts request wrapper). */
export function getToken(): string | null {
  return useSessionStore.getState().token;
}

export function getClaims(): JWTClaims | null {
  const token = getToken();
  return token ? parseJWT(token) : null;
}

export function getTenantId(): string | null {
  return getClaims()?.tenant_id ?? null;
}

export function isAuthenticated(): boolean {
  const claims = getClaims();
  return claims !== null && !isExpired(claims);
}
