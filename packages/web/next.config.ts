import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Security headers
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebase.com https://*.googleapis.com https://*.googletagmanager.com https://*.googletagmanager.com https://apis.google.com https://accounts.google.com https://*.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.firebase.com https://*.googleapis.com https://*.stripe.com https://www.google-analytics.com https://www.googletagmanager.com https://accounts.google.com wss://*.firebaseio.com",
              "frame-src 'self' https://*.stripe.com https://*.firebase.com https://auth.hireall.app https://*.hireall.app",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
      {
        // API routes specific headers
        source: "/api/(.*)",
        headers: [
          {
            key: "X-RateLimit-Limit",
            value: "100",
          },
          {
            key: "X-RateLimit-Window",
            value: "60",
          },
        ],
      },
    ];
  },

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

  // Server external packages
  serverExternalPackages: [],

  // Disable X-Powered-By header
  poweredByHeader: false,
};

export default nextConfig;
