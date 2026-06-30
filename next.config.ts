import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static HTML export — deployable on the existing n0c (Apache/LiteSpeed) host
  // with no Node runtime.
  output: "export",

  // Apache serves /approach/ -> /approach/index.html, mirroring the old WordPress
  // trailing-slash URLs so existing inbound links and SEO keep resolving.
  trailingSlash: true,

  // next/image cannot run its optimizer without a server; serve images as-authored.
  images: { unoptimized: true },
};

export default nextConfig;
