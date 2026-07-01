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

  // Empty for the production root deploy; set to e.g. "/preview" to build a staging
  // copy that lives in a subfolder of the n0c web root (so asset paths resolve there).
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
};

export default nextConfig;
