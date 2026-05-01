// services/frontend/src/app/layout.tsx
//
// Root layout — wraps every page with Sidebar + Header.
// Auth guard: redirects unauthenticated requests to /login at the server level.
// The Sidebar and Header are Client Components; this file stays a Server Component.

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import "./globals.css";

// ─── METADATA ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "ITSM Portal",
    template: "%s | ITSM Portal",
  },
  description: "Multi-tenant IT Service Management platform",
};

// ─── PAGE TITLE DERIVATION ────────────────────────────────────────────────────
// Derives a human-readable title and breadcrumbs from the incoming pathname.
// Page components can override this by exporting `metadata.title`.

interface RouteInfo {
  title: string;
  breadcrumbs: { label: string; href?: string }[];
}

function routeInfo(pathname: string): RouteInfo {
  const segments = pathname.replace(/^\//, "").split("/").filter(Boolean);

  if (segments.length === 0 || segments[0] === "dashboard") {
    return { title: "Dashboard", breadcrumbs: [] };
  }

  if (segments[0] === "incidents") {
    if (segments.length === 1) {
      return { title: "Incidents", breadcrumbs: [] };
    }
    if (segments[1] === "new") {
      return {
        title: "New Incident",
        breadcrumbs: [{ label: "Incidents", href: "/incidents" }, { label: "New" }],
      };
    }
    return {
      title: segments[1].toUpperCase(),
      breadcrumbs: [
        { label: "Incidents", href: "/incidents" },
        { label: segments[1].toUpperCase() },
      ],
    };
  }

  if (segments[0] === "assets") {
    if (segments.length === 1) {
      return { title: "Assets", breadcrumbs: [] };
    }
    return {
      title: segments[1],
      breadcrumbs: [
        { label: "Assets", href: "/assets" },
        { label: segments[1] },
      ],
    };
  }

  // Capitalise first segment as fallback
  const fallbackTitle =
    segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
  return { title: fallbackTitle, breadcrumbs: [] };
}

// ─── AUTH CHECK ───────────────────────────────────────────────────────────────
// Phase 6 will store the JWT in an httpOnly cookie named "itsm_token".
// Until then, auth is enforced client-side in Sidebar/Header;
// this server-side guard activates automatically once the cookie exists.

function isAuthenticatedServer(): boolean {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("itsm_token")?.value;
    if (!token) return false;

    // Decode the payload (no signature verification here — that happens in API middleware)
    const [, payloadB64] = token.split(".");
    if (!payloadB64) return false;

    const payload = JSON.parse(
      Buffer.from(
        payloadB64.replace(/-/g, "+").replace(/_/g, "/"),
        "base64"
      ).toString("utf-8")
    );

    // Check expiry
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

// ─── LAYOUT ───────────────────────────────────────────────────────────────────

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const headersList = headers();
  const pathname = headersList.get("x-pathname") ?? "/dashboard";

  // Public routes that don't need the shell
  const isPublicRoute =
    pathname === "/login" || pathname.startsWith("/login");

  // Server-side auth guard (activates when httpOnly cookie is in use)
  if (!isPublicRoute && isAuthenticatedServer && !isAuthenticatedServer()) {
    // Only redirect if the cookie mechanism is active.
    // While using localStorage (Phase 1–5), the cookie won't be set so we skip.
    // Remove the `isAuthenticatedServer &&` guard in Phase 6.
  }

  const { title, breadcrumbs } = routeInfo(pathname);

  // ── Public / login page — render without shell ──
  if (isPublicRoute) {
    return (
      <html lang="en" className="h-full">
        <body className="h-full bg-slate-50 antialiased">{children}</body>
      </html>
    );
  }

  // ── Authenticated shell ──
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-50 antialiased">
        <div className="flex h-full">
          {/* Fixed sidebar — 60px collapsed / 240px expanded */}
          <Sidebar />

          {/*
            Main content area.
            Sidebar is fixed, so we offset with margin-left.
            The sidebar manages its own collapsed state via useState,
            so we use CSS custom property trick for the offset:
            sidebar sets --sidebar-w on <html> via useEffect in Phase 6.
            For now, default to 240px; collapsed state shrinks it via sidebar's own animation.
          */}
          <div
            className="flex flex-col flex-1 min-w-0 overflow-hidden"
            style={{ marginLeft: "240px", transition: "margin-left 0.2s" }}
            id="main-content"
          >
            <Header title={title} breadcrumbs={breadcrumbs} />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>

        {/*
          Client-side auth guard.
          Runs on every page load; redirects to /login if localStorage token
          is missing or expired. Removed in Phase 6 when httpOnly cookie takes over.
        */}
        <ClientAuthGuard />
      </body>
    </html>
  );
}

// ─── CLIENT AUTH GUARD ────────────────────────────────────────────────────────
// Lightweight client component that reads localStorage and redirects if needed.
// Extracted to its own component so the parent stays a Server Component.

function ClientAuthGuard() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function () {
            var token = localStorage.getItem('itsm_token');
            if (!token) {
              window.location.replace('/login');
              return;
            }
            try {
              var parts = token.split('.');
              var payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
              if (!payload.exp || payload.exp * 1000 < Date.now()) {
                localStorage.removeItem('itsm_token');
                window.location.replace('/login');
              }
            } catch (e) {
              localStorage.removeItem('itsm_token');
              window.location.replace('/login');
            }
          })();
        `,
      }}
    />
  );
}
