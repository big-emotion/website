import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output: Node.js server in a Docker container (see docs/adr/0005).
  // Marketing pages stay SSG; API routes and /espace are served dynamically.
  output: "standalone",

  // Preserve the old WordPress trailing-slash URL shape for SEO continuity.
  trailingSlash: true,

  // next/image optimizer runs on the standalone server — no longer unoptimized.

  // Legacy WordPress → one-page anchor 301s (replaced .htaccess RewriteRules).
  // Trailing-slash variants included because next.config redirects run before
  // Next.js's own trailing-slash normalisation.
  async redirects() {
    return [
      {
        source: "/contactez-nous",
        destination: "/#contact",
        permanent: true,
      },
      {
        source: "/contactez-nous/",
        destination: "/#contact",
        permanent: true,
      },
      { source: "/les-membres", destination: "/#culture", permanent: true },
      { source: "/les-membres/", destination: "/#culture", permanent: true },
      {
        source: "/case-study-mamiezi",
        destination: "/#cases",
        permanent: true,
      },
      {
        source: "/case-study-mamiezi/",
        destination: "/#cases",
        permanent: true,
      },
      {
        source: "/case-study-adolebatisseur",
        destination: "/#cases",
        permanent: true,
      },
      {
        source: "/case-study-adolebatisseur/",
        destination: "/#cases",
        permanent: true,
      },
    ];
  },

  // Security headers (replaced .htaccess mod_headers directives).
  // No CSP: Next.js injects an inline bootstrap <script> whose nonce/hash
  // would need to be generated at build time — deferred to a follow-up.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value:
              "geolocation=(), camera=(), microphone=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
