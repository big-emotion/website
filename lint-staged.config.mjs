const lintStagedConfig = {
  // Big Emotion baseline — keep these two rows first so the file stays
  // diff-able against the standard; project-specific rows go below.
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{css,md,json,mjs}": ["prettier --write"],
  "src/**/*.{ts,tsx,mjs}": "node scripts/lint-req-annotations.mjs --staged",
};

export default lintStagedConfig;
