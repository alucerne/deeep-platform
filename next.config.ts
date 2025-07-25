import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Ignore TypeScript errors in Supabase functions
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors in Supabase functions
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
