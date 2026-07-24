const commitlintConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // `release` is here for the /bigemotion-release version-bump commits; the
    // rest is the Big Emotion standard enum, shared across every project so a
    // Ferry agent's commit passes the same gate a human's does.
    "type-enum": [
      2,
      "always",
      [
        "build",
        "chore",
        "ci",
        "docs",
        "feat",
        "fix",
        "perf",
        "refactor",
        "release",
        "revert",
        "style",
        "test",
      ],
    ],
  },
};

export default commitlintConfig;
