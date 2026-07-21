import { defineConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { fileURLToPath } from "node:url";

// Separate from vitest.config.ts on purpose: this project renders stories in a real
// Playwright browser, which the CI gate's `pnpm test` must not depend on (AGENTS.md
// scope note — the design-system shape, not the full drift-gate battery). Run it
// locally via `pnpm test:storybook` once browsers are installed
// (`pnpm exec playwright install chromium`).
export default defineConfig({
  plugins: [storybookTest({ configDir: ".storybook" })],
  test: {
    name: "storybook",
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
    setupFiles: ["./.storybook/vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
