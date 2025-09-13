import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return {
      // Ensure legacy routes are routed before checking filesystem
      beforeFiles: [
        {
          source: "/api/convex/:path*",
          destination: "/api/app/:path*",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
