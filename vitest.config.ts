import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
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
