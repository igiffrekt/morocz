import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  generateBuildId: () => {
    // Stable build ID based on build timestamp
    return `build-${Date.now()}`;
  },
  env: {
    BUILD_ID: `build-${Date.now()}`,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: /node_modules|\.playwright-mcp/,
      };
    }
    return config;
  },
};

export default nextConfig;
