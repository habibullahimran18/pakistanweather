import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Include the ETL-produced dataset in serverless output so the API layer
  // can read data/processed/weather_clean.csv at runtime (Vercel compatible).
  outputFileTracingIncludes: {
    "/api/**/*": ["./data/processed/weather_clean.csv"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
