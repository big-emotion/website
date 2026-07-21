#!/usr/bin/env node
/**
 * Diff local Prismic custom types and shared slices against the live repository.
 * Exits non-zero on any drift. Designed as a pre-merge gate.
 *
 * Three drift kinds reported per entity:
 *   - local-only   : exists in code, not in Prismic   → would be pushed
 *   - remote-only  : exists in Prismic, not in code   → orphan (pull or delete)
 *   - modified     : present in both but differs      → structural diff shown
 *
 * Sources:
 *   customtypes/<id>/index.json     — one file per custom type
 *   src/slices/<Name>/model.json    — one file per shared slice
 *
 * Required env:
 *   PRISMIC_REPOSITORY_NAME
 *   PRISMIC_CUSTOM_TYPES_API_TOKEN  (read scope is sufficient)
 *
 * Exit codes:
 *   0 — no drift
 *   1 — drift detected
 *   2 — operational error (missing env, API unreachable, malformed payload)
 */

import { resolve } from "node:path";

import {
  CUSTOM_TYPES_API_BASE,
  buildCustomTypesHeaders,
  loadEntitiesFromDir,
  safeResponseText,
} from "./lib/prismic-custom-types-api.mjs";
import { requirePrismicRepository } from "./lib/prismic-repository.mjs";

const root = new URL("..", import.meta.url).pathname;

// Slice Machine uploads variation thumbnails (variations[*].imageUrl) directly
// to the remote; they never exist in local model.json. Diffing them would keep
// the gate permanently red on any slice edited through the Slice Machine UI.
const SCREENSHOT_KEYS = new Set(["imageUrl"]);

let driftCount = 0;
let HEADERS;

// CLI guard — the live API check only runs when this file is executed directly,
// not when the test file imports the pure helpers below.
if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}

async function main() {
  const repository = requirePrismicRepository();
  const token = process.env.PRISMIC_CUSTOM_TYPES_API_TOKEN;

  if (!token) {
    console.error(
      "prismic:check — PRISMIC_CUSTOM_TYPES_API_TOKEN is not set.\n" +
        "  In CI, configure PRISMIC_CUSTOM_TYPES_API_TOKEN as a repository secret.",
    );
    process.exit(2);
  }

  HEADERS = buildCustomTypesHeaders(repository, token);

  await checkKind("customtypes", "custom type", resolve(root, "customtypes"), "index.json");
  await checkKind("slices", "slice", resolve(root, "src/slices"), "model.json");

  if (driftCount > 0) {
    console.error(
      `\nprismic:check FAILED — ${driftCount} drift(s) detected against repo "${repository}".`,
    );
    console.error(
      "Run `pnpm prismic:push` to publish local changes, or `pnpm prismic:pull` to\n" +
        "rapatriate the remote state when Prismic is authoritative.",
    );
    process.exit(1);
  }

  console.log(`\nprismic:check OK — local and remote are in sync (repo: ${repository}).`);
  process.exit(0);
}

// ---

async function checkKind(kind, label, dir, filename) {
  let localEntities;
  try {
    localEntities = loadEntitiesFromDir(dir, filename);
  } catch (err) {
    console.error(`prismic:check — cannot parse ${kind} source: ${err.message}`);
    process.exit(2);
  }
  const localById = indexBy(localEntities, "id");

  const remoteById = indexBy(await fetchRemote(kind), "id");

  const allIds = new Set([...localById.keys(), ...remoteById.keys()]);

  if (allIds.size === 0) {
    console.log(`prismic:check — no ${label}s found locally or remotely.`);
    return;
  }

  console.log(`\nChecking ${label}s (${allIds.size} total)…`);

  for (const id of [...allIds].sort()) {
    const local = localById.get(id);
    const remote = remoteById.get(id);

    if (local && !remote) {
      driftCount++;
      console.error(`  ! ${label} "${id}" — local-only (will be pushed on next sync)`);
      continue;
    }
    if (!local && remote) {
      driftCount++;
      console.error(`  ! ${label} "${id}" — remote-only (orphan, not tracked in source)`);
      continue;
    }

    const diffs = deepDiff(normalizeForDiff(local), normalizeForDiff(remote));
    if (diffs.length === 0) {
      console.log(`  = ${label} "${id}" — in sync`);
      continue;
    }
    driftCount++;
    console.error(`  ! ${label} "${id}" — modified (${diffs.length} change(s)):`);
    for (const diff of diffs.slice(0, 20)) {
      console.error(`      ${formatDiff(diff)}`);
    }
    if (diffs.length > 20) {
      console.error(`      … ${diffs.length - 20} more change(s) hidden`);
    }
  }
}

async function fetchRemote(kind) {
  const res = await fetch(`${CUSTOM_TYPES_API_BASE}/${kind}`, { headers: HEADERS });
  if (!res.ok) {
    console.error(
      `prismic:check — Prismic API returned HTTP ${res.status} for GET /${kind}: ` +
        `${await safeResponseText(res)}`,
    );
    process.exit(2);
  }
  const payload = await res.json();
  if (!Array.isArray(payload)) {
    console.error(`prismic:check — unexpected response shape for GET /${kind} (expected array).`);
    process.exit(2);
  }
  return payload;
}

function indexBy(entities, key) {
  return new Map(entities.map((entity) => [entity[key], entity]));
}

/**
 * Strip Slice Machine screenshot fields from an entity's variations before
 * diffing. Returns a shallow copy — the input is never mutated. Custom types
 * (no top-level `variations`) and null/undefined pass through untouched.
 */
export function normalizeForDiff(entity) {
  if (!entity?.variations) return entity;
  return {
    ...entity,
    variations: entity.variations.map((variation) => {
      const stripped = { ...variation };
      for (const key of SCREENSHOT_KEYS) delete stripped[key];
      return stripped;
    }),
  };
}

/**
 * Recursively diffs two JSON-ish values, returning a flat list of
 * { kind, path, local?, remote? } records.
 */
export function deepDiff(local, remote, path = "") {
  const diffs = [];

  if (local === remote) return diffs;

  const localType = typeOf(local);
  const remoteType = typeOf(remote);

  if (localType !== remoteType) {
    diffs.push({ kind: "type-changed", path, local: localType, remote: remoteType });
    return diffs;
  }

  if (localType === "primitive") {
    diffs.push({ kind: "value-changed", path, local, remote });
    return diffs;
  }

  if (localType === "array") {
    const max = Math.max(local.length, remote.length);
    for (let i = 0; i < max; i++) {
      const sub = `${path}[${i}]`;
      if (i >= local.length) diffs.push({ kind: "added-remote", path: sub, remote: remote[i] });
      else if (i >= remote.length) diffs.push({ kind: "added-local", path: sub, local: local[i] });
      else diffs.push(...deepDiff(local[i], remote[i], sub));
    }
    return diffs;
  }

  for (const key of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    const sub = path ? `${path}.${key}` : key;
    if (!(key in local)) diffs.push({ kind: "added-remote", path: sub, remote: remote[key] });
    else if (!(key in remote)) diffs.push({ kind: "added-local", path: sub, local: local[key] });
    else diffs.push(...deepDiff(local[key], remote[key], sub));
  }
  return diffs;
}

function typeOf(value) {
  if (value === null) return "primitive";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return "primitive";
}

function formatDiff(diff) {
  const at = diff.path || "(root)";
  switch (diff.kind) {
    case "added-local":
      return `+ ${at}  (only in local: ${preview(diff.local)})`;
    case "added-remote":
      return `- ${at}  (only in remote: ${preview(diff.remote)})`;
    case "value-changed":
      return `~ ${at}  local=${preview(diff.local)}  remote=${preview(diff.remote)}`;
    case "type-changed":
      return `~ ${at}  type local=${diff.local}  remote=${diff.remote}`;
    default:
      return `? ${at}`;
  }
}

function preview(value) {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) return String(value);
  return serialized.length > 80 ? `${serialized.slice(0, 77)}...` : serialized;
}
