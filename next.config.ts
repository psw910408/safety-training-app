import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['sqlite3'],
  outputFileTracingIncludes: {
    '/**': ['./jongno.db', './samhwa.db'],
  },
};

export default nextConfig;
