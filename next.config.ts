import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployments (Railway, etc.)
  output: 'standalone',
  
  // Explicitly expose environment variables (optional, but helps with Railway)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

export default nextConfig;
