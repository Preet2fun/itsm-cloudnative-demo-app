// services/frontend/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── API Proxy Rewrites ──────────────────────────────────────────────────────
  //
  // Proxies frontend /api/* paths to the appropriate backend microservices.
  // In production, these services are reachable by their Docker Compose /
  // Kubernetes service names on port 80.
  //
  // Mapping:
  //   /api/auth/*        → http://user-service/api/v1/*
  //   /api/users/*       → http://user-service/api/v1/*
  //   /api/incidents/*   → http://incident-service/api/v1/*
  //   /api/assets/*      → http://asset-service/api/v1/*
  //
  // NEXT_PUBLIC_API_BASE_URL stays empty ("") in local dev when using these
  // rewrites — the fetch() calls in lib/api.ts will hit /api/v1/... which
  // Next.js transparently rewrites to the correct service.
  //
  // Override individual destinations via env vars for local development
  // (e.g. pointing at localhost ports instead of service names).

  async rewrites() {
    const userServiceUrl =
      process.env.USER_SERVICE_URL ?? "http://user-service";
    const incidentServiceUrl =
      process.env.INCIDENT_SERVICE_URL ?? "http://incident-service";
    const assetServiceUrl =
      process.env.ASSET_SERVICE_URL ?? "http://asset-service";

    return [
      // ── Auth endpoints (user-service) ──
      {
        source: "/api/v1/auth/:path*",
        destination: `${userServiceUrl}/api/v1/auth/:path*`,
      },

      // ── User management endpoints (user-service) ──
      {
        source: "/api/v1/users/:path*",
        destination: `${userServiceUrl}/api/v1/users/:path*`,
      },

      // ── Incident endpoints (incident-service) ──
      {
        source: "/api/v1/incidents/:path*",
        destination: `${incidentServiceUrl}/api/v1/incidents/:path*`,
      },

      // ── Asset endpoints (asset-service) ──
      {
        source: "/api/v1/assets/:path*",
        destination: `${assetServiceUrl}/api/v1/assets/:path*`,
      },
    ];
  },

  // ── Security headers ────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // ── General config ──────────────────────────────────────────────────────────

  // Enforce strict React mode in development
  reactStrictMode: true,

  // Disable the default X-Powered-By header
  poweredByHeader: false,

  // Image domains — extend as needed for asset thumbnails, avatars, etc.
  images: {
    remotePatterns: [],
  },

  // Output mode — set to "standalone" for Docker multi-stage builds
  // output: "standalone",
};

export default nextConfig;
