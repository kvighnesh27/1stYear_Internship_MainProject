import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Add this — extends proxy timeout to 120 seconds
  experimental: {
    proxyTimeout: 120_000,
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;