import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output: Node.js server in a Docker container (see docs/adr/0005).
  // Marketing pages stay SSG; API routes and /espace are served dynamically.
  output: "standalone",

  // Preserve the old WordPress trailing-slash URL shape for SEO continuity.
  trailingSlash: true,

  // next/image optimizer runs on the standalone server — no longer unoptimized.

  // Legacy WordPress 301s (replaced .htaccess RewriteRules). These now land on the
  // real section routes rather than a home-page anchor: SWBE-21 turned the one-pager
  // into six scene panels, so `/#culture` and friends no longer exist as anchors and
  // would have dumped every legacy visitor at the top of the home page.
  //
  // The source URLs, their trailing-slash variants and `permanent: true` are the SEO
  // invariant and stay exactly as they were — only the destination moved.
  // Destinations are FR (the default locale, unprefixed): every one of these URLs was
  // indexed from the French WordPress site.
  //
  // Trailing-slash variants included because next.config redirects run before
  // Next.js's own trailing-slash normalisation. They also run *before* the proxy, so
  // locale routing never sees them.
  async redirects() {
    return [
      { source: "/contactez-nous", destination: "/contact/", permanent: true },
      { source: "/contactez-nous/", destination: "/contact/", permanent: true },
      { source: "/les-membres", destination: "/culture/", permanent: true },
      { source: "/les-membres/", destination: "/culture/", permanent: true },
      { source: "/case-study-mamiezi", destination: "/cases/", permanent: true },
      { source: "/case-study-mamiezi/", destination: "/cases/", permanent: true },
      {
        source: "/case-study-adolebatisseur",
        destination: "/cases/",
        permanent: true,
      },
      {
        source: "/case-study-adolebatisseur/",
        destination: "/cases/",
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
            value: "geolocation=(), camera=(), microphone=(), browsing-topics=()",
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

// The plugin must wrap the config that carries `trailingSlash`: it copies that flag
// into an env var the next-intl middleware reads when it normalises its own rewrites
// and redirects. Wrapping an empty object instead would make every locale redirect
// drop the trailing slash and bounce through an extra hop.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
