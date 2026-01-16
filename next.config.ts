import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel optimiza automáticamente, no necesitamos 'standalone' para Vercel
  // output: 'standalone', // Solo necesario para Docker
};

export default nextConfig;
