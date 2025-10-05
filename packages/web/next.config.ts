import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Webpack configuration to handle Node.js built-in modules
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        fs: false,
        net: false,
        tls: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Handle node: protocol imports
    config.externals = config.externals.map((external: any) => {
      if (typeof external === 'string' && external.startsWith('node:')) {
        return external.replace('node:', '');
      }
      return external;
    });

    return config;
  },

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

  // Disable X-Powered-By header
  poweredByHeader: false,
};

export default nextConfig;
