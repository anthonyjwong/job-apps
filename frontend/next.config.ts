import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Helps catch issues during dev
  reactStrictMode: true,
  // Ensure webpack is used; turbopack is only triggered by CLI flags in v15
};

export default nextConfig;
