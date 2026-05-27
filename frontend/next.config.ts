import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      accounts: path.resolve(__dirname, "app/lib/mock-accounts.ts"),
    };
    return config;
  },
  experimental: {
    turbo: {
      resolveAlias: {
        // Use absolute path so Turbopack doesn't resolve relatively from deep within node_modules!
        accounts: path.resolve(__dirname, "app/lib/mock-accounts.ts"),
      },
    },
  },
};

export default nextConfig;
