import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Chronicle is a display app; don't block dev builds on lint.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
