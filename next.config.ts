import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Resumes are uploaded through a Server Action; allow up to ~10 MB.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
