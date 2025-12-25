import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Image optimization - using remotePatterns (Next.js 16 best practice)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
  },
  
  // Turbopack configuration (Next.js 16 uses Turbopack by default)
  // Empty config silences the webpack migration warning
  turbopack: {},

  // Security headers
  async headers() {
    const customAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_CUSTOM_AUTH_DOMAIN;
    const customAuthOrigin = customAuthDomain
      ? customAuthDomain.startsWith("http")
        ? customAuthDomain
        : `https://${customAuthDomain}`
      : undefined;

    const connectSrc = [
      "'self'",
      "https://*.firebase.com",
      "https://*.googleapis.com",
      "https://*.stripe.com",
      "https://www.google-analytics.com",
      "https://www.googletagmanager.com",
      "https://accounts.google.com",
      "https://*.google.com",
      "https://*.gstatic.com",
      "https://*.googleusercontent.com",
      "wss://*.firebaseio.com",
    ];

    if (customAuthOrigin && !connectSrc.includes(customAuthOrigin)) {
      connectSrc.push(customAuthOrigin);
    }

    const frameSrc = [
      "'self'",
      "https://*.stripe.com",
      "https://*.firebase.com",
      "https://auth.hireall.app",
      "https://*.hireall.app",
      "https://accounts.google.com",
      "https://*.google.com",
      "https://*.googleusercontent.com",
      "https://*.gstatic.com",
    ];

    if (customAuthOrigin && !frameSrc.includes(customAuthOrigin)) {
      frameSrc.push(customAuthOrigin);
    }

    const contentSecurityPolicy = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebase.com https://*.googleapis.com https://*.googletagmanager.com https://*.googletagmanager.com https://apis.google.com https://accounts.google.com https://*.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      `connect-src ${connectSrc.join(" ")}`,
      `frame-src ${frameSrc.join(" ")}`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
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
          {
            key: "Cross-Origin-Opener-Policy",
            value: "unsafe-none",
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
};

export default nextConfig;
