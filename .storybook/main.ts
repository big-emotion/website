import type { StorybookConfig } from "@storybook/nextjs";

// Chancellerie-pattern base config (SWBE-23): catalogues the real components under
// src/stories/ so the design-system/frames/ baseline has something to render against.
const config: StorybookConfig = {
  stories: ["../src/stories/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-vitest"],
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  staticDirs: ["../public"],
};

export default config;
