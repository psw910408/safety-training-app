import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['sqlite3'],
  outputFileTracingIncludes: {
    '/**': ['./jongno.db', './samhwa.db', './public/templates/**/*'],
  },
};

export default nextConfig;
