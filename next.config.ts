import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployments (Railway, etc.)
  output: 'standalone',
};

export default nextConfig;
