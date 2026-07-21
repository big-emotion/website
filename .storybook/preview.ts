import type { Preview } from "@storybook/nextjs";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    backgrounds: {
      options: {
        paper: { name: "paper", value: "#ffffff" },
        ink: { name: "ink", value: "#000000" },
      },
    },
    initialGlobals: {
      backgrounds: { value: "paper" },
    },
  },
};

export default preview;
