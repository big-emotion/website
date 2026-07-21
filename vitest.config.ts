import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Next's image loader turns `import photo from "./x.jpg"` into a StaticImageData object;
 * Vite hands back a bare URL string, and `next/image` then throws for the missing
 * intrinsic dimensions. Stub the shape so components render in tests the way they do in
 * the app.
 *
 * The dimensions here are arbitrary and deliberately unasserted — what proves the real
 * files are sound is `next build`, which fails on a missing or unreadable import and is
 * part of the pre-commit gate.
 */
function nextStaticImageStub(): Plugin {
  return {
    name: "next-static-image-stub",
    enforce: "pre",
    load(id) {
      const file = id.split("?")[0];
      if (!/\.(jpe?g|png|webp|avif)$/.test(file)) return null;

      const stub = { src: `/_next/static/media/${basename(file)}`, width: 1536, height: 2048 };
      return `export default ${JSON.stringify(stub)}`;
    },
  };
}

export default defineConfig({
  plugins: [react(), nextStaticImageStub()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // next-intl ships ESM whose `react-server` export condition Vitest would otherwise
    // resolve; inlining it makes `createNavigation` and the client hooks load as the
    // browser build the jsdom tests actually render against.
    server: { deps: { inline: ["next-intl"] } },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
