#!/usr/bin/env node
/**
 * Generates slicemachine.config.json targeting the Prismic repository named by
 * PRISMIC_REPOSITORY_NAME, so `pnpm slicemachine` opens the SAME repo the rest
 * of the toolchain targets (prismic:push / prismic:check / app runtime).
 *
 * slicemachine.config.json is not tracked in git. Run this script after a fresh
 * clone before launching Slice Machine — `pnpm slicemachine` does it for you.
 *
 * WHY a generator and not an env reference: Slice Machine reads
 * slicemachine.config.json as static JSON — @slicemachine/manager's
 * getSliceMachineConfig does a bare JSON.parse with no interpolation — so the
 * only way to make the UI environment-aware is to rewrite the file before launch.
 *
 * WHY surgical text replacement and not parse + re-stringify: BASE_CONFIG keeps
 * `libraries` on a single line (["./src/slices"]); JSON.stringify would expand
 * it and reformat the whole file. Replacing only the two repo-bound values keeps
 * every other byte intact, so regeneration is idempotent and diff-friendly.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { requirePrismicRepository } from "./lib/prismic-repository.mjs";

/**
 * Canonical base config. The repository name here is only a placeholder shape —
 * requirePrismicRepository() fails loudly when PRISMIC_REPOSITORY_NAME is unset,
 * so the value below is always overwritten before the file is written.
 */
export const BASE_CONFIG = `{
  "repositoryName": "big-emotion",
  "apiEndpoint": "https://big-emotion.cdn.prismic.io/api/v2",
  "adapter": "@slicemachine/adapter-next",
  "libraries": ["./src/slices"],
  "localSliceSimulatorURL": "http://localhost:3000/slice-simulator"
}
`;

export function apiEndpointFor(repository) {
  return `https://${repository}.cdn.prismic.io/api/v2`;
}

/**
 * Returns `rawConfig` with `repositoryName` + `apiEndpoint` repointed at
 * `repository`, leaving every other byte untouched. Function replacers avoid
 * any `$`-pattern surprises in the substituted repo name.
 */
export function repointConfig(rawConfig, repository) {
  return rawConfig
    .replace(/("repositoryName":\s*)"[^"]*"/, (_match, key) => `${key}"${repository}"`)
    .replace(
      /("apiEndpoint":\s*)"[^"]*"/,
      (_match, key) => `${key}"${apiEndpointFor(repository)}"`,
    );
}

const CONFIG_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "slicemachine.config.json",
);

function run() {
  const repository = requirePrismicRepository();

  let existing;
  try {
    existing = readFileSync(CONFIG_PATH, "utf8");
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    existing = null;
  }

  const next = repointConfig(existing ?? BASE_CONFIG, repository);

  if (existing !== null && next === existing) {
    console.log(`slicemachine.config.json already targets "${repository}"`);
    return;
  }

  writeFileSync(CONFIG_PATH, next);
  console.log(`slicemachine.config.json → "${repository}"`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  run();
}
