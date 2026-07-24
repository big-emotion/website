// @req REQ-050

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("project-standard quality gates", () => {
  it("exposes the requirement traceability command in package.json", () => {
    const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

    expect(packageJson.scripts["lint:req"]).toBe("node scripts/lint-req-annotations.mjs");
  });

  it("runs every core quality gate and requirement traceability in CI", () => {
    const workflow = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");

    for (const command of [
      "pnpm lint",
      "pnpm typecheck",
      "pnpm format:check",
      "pnpm lint:req",
      "pnpm test",
      "pnpm build",
    ]) {
      expect(workflow).toContain(command);
    }
    expect(workflow).toContain("gitleaks");
  });

  it("records the canonical Engineering tree page separately in Atlassian config", () => {
    const config = JSON.parse(readFileSync(join(root, "docs/confluence-spec/config.json"), "utf8"));

    expect(config.engineeringTreePageId).toBe("171212801");
  });
});
