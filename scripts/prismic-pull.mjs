#!/usr/bin/env node
/**
 * Pull one or more Prismic custom types or shared slices from the live
 * repository into local source. Symmetric to `prismic:push` and used to
 * rapatriate entities created in the dashboard (orphans reported by
 * `prismic:check` as `remote-only`).
 *
 * Usage:
 *   pnpm prismic:pull <id>              — pull a custom type by id
 *   pnpm prismic:pull --slice <id>      — pull a shared slice by id
 *   pnpm prismic:pull --all-orphans     — pull every remote entity not present locally
 *
 * Required env:
 *   PRISMIC_REPOSITORY_NAME
 *   PRISMIC_CUSTOM_TYPES_API_TOKEN  (read scope is sufficient)
 *
 * Writes:
 *   customtypes/<id>/index.json      for custom types
 *   src/slices/<Name>/model.json     for shared slices
 *
 * Will overwrite an existing local file. Run `git diff` after pull to review
 * the changes before committing.
 */

import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { parseArgs } from "node:util";

import {
  CUSTOM_TYPES_API_BASE,
  buildCustomTypesHeaders,
  safeResponseText,
} from "./lib/prismic-custom-types-api.mjs";
import { requirePrismicRepository } from "./lib/prismic-repository.mjs";

const root = new URL("..", import.meta.url).pathname;
const repository = requirePrismicRepository();
const token = process.env.PRISMIC_CUSTOM_TYPES_API_TOKEN;

if (!token) {
  console.error("prismic:pull — PRISMIC_CUSTOM_TYPES_API_TOKEN is not set.");
  process.exit(2);
}

const { values, positionals } = parseArgs({
  options: {
    slice: { type: "boolean", default: false },
    "all-orphans": { type: "boolean", default: false },
  },
  allowPositionals: true,
  strict: false,
});

const HEADERS = buildCustomTypesHeaders(repository, token);

if (values["all-orphans"]) {
  await pullAllOrphans();
} else if (positionals.length === 1) {
  await pullOne(values.slice ? "slices" : "customtypes", positionals[0]);
} else {
  console.error(
    "Usage:\n" +
      "  pnpm prismic:pull <id>             pull a custom type\n" +
      "  pnpm prismic:pull --slice <id>     pull a shared slice\n" +
      "  pnpm prismic:pull --all-orphans    pull every remote-only entity",
  );
  process.exit(2);
}

// ---

async function pullOne(kind, id) {
  const entity = await fetchOne(kind, id);
  console.log(`  ↓ ${labelOf(kind)} "${entity.id}" → ${relativeToRoot(writeEntity(kind, entity))}`);
}

async function pullAllOrphans() {
  let pulled = 0;
  for (const kind of ["customtypes", "slices"]) {
    const localIds = new Set(localIdsOf(kind));
    const orphans = (await fetchAll(kind)).filter((entity) => !localIds.has(entity.id));
    if (orphans.length === 0) {
      console.log(`No orphan ${labelOf(kind)}s.`);
      continue;
    }
    for (const entity of orphans) {
      console.log(
        `  ↓ ${labelOf(kind)} "${entity.id}" → ${relativeToRoot(writeEntity(kind, entity))}`,
      );
      pulled++;
    }
  }
  console.log(`\nprismic:pull — ${pulled} entity(ies) rapatriated.`);
}

async function fetchOne(kind, id) {
  const res = await fetch(`${CUSTOM_TYPES_API_BASE}/${kind}/${encodeURIComponent(id)}`, {
    headers: HEADERS,
  });
  if (res.status === 404) {
    console.error(`prismic:pull — ${labelOf(kind)} "${id}" not found on Prismic.`);
    process.exit(1);
  }
  if (!res.ok) {
    console.error(
      `prismic:pull — HTTP ${res.status} for GET /${kind}/${id}: ${await safeResponseText(res)}`,
    );
    process.exit(2);
  }
  return await res.json();
}

async function fetchAll(kind) {
  const res = await fetch(`${CUSTOM_TYPES_API_BASE}/${kind}`, { headers: HEADERS });
  if (!res.ok) {
    console.error(
      `prismic:pull — HTTP ${res.status} for GET /${kind}: ${await safeResponseText(res)}`,
    );
    process.exit(2);
  }
  const payload = await res.json();
  if (!Array.isArray(payload)) {
    console.error(`prismic:pull — unexpected response shape for GET /${kind} (expected array).`);
    process.exit(2);
  }
  return payload;
}

function writeEntity(kind, entity) {
  const dir =
    kind === "customtypes"
      ? join(resolve(root, "customtypes"), entity.id)
      : join(resolve(root, "src/slices"), entity.id);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, kind === "customtypes" ? "index.json" : "model.json");
  writeFileSync(path, JSON.stringify(entity, null, 2) + "\n", "utf8");
  return path;
}

function localIdsOf(kind) {
  const dir = kind === "customtypes" ? resolve(root, "customtypes") : resolve(root, "src/slices");
  const filename = kind === "customtypes" ? "index.json" : "model.json";
  if (!existsSync(dir)) return [];
  const ids = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    const filePath = join(full, filename);
    if (!existsSync(filePath)) continue;
    try {
      // Per-file catch: one unparseable file must not mask other local entities.
      // prismic:check surfaces parse errors authoritatively.
      ids.push(JSON.parse(readFileSync(filePath, "utf8")).id);
    } catch {
      // skip
    }
  }
  return ids;
}

function labelOf(kind) {
  return kind === "customtypes" ? "custom type" : "slice";
}

function relativeToRoot(path) {
  return path.replace(root, "").replace(/^\/+/, "");
}
