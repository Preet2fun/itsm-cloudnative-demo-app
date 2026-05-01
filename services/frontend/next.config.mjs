/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const userServiceUrl =
      process.env.USER_SERVICE_URL ?? "http://user-service";
    const incidentServiceUrl =
      process.env.INCIDENT_SERVICE_URL ?? "http://incident-service";
    const assetServiceUrl =
      process.env.ASSET_SERVICE_URL ?? "http://asset-service";

    return [
      {
        source: "/api/v1/auth/:path*",
        destination: `${userServiceUrl}/api/v1/auth/:path*`,
      },
      {
        source: "/api/v1/users/:path*",
        destination: `${userServiceUrl}/api/v1/users/:path*`,
      },
      {
        source: "/api/v1/incidents/:path*",
        destination: `${incidentServiceUrl}/api/v1/incidents/:path*`,
      },
      {
        source: "/api/v1/assets/:path*",
        destination: `${assetServiceUrl}/api/v1/assets/:path*`,
      },
    ];
  },

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

  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [],
  },
  output: "standalone",
};

export default nextConfig;
