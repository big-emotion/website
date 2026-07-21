#!/usr/bin/env node
/**
 * Push local Prismic custom types and shared slices to the live repository
 * via the Custom Types API (https://prismic.io/docs/custom-types-api).
 *
 * Git is the source of truth for the content model: the dashboard is never the
 * place a model change originates. Edit the JSON, push, then `prismic:check`.
 *
 * Sources (read-only):
 *   customtypes/<id>/index.json     — one file per custom type
 *   src/slices/<Name>/model.json    — one file per shared slice
 *
 * Required env:
 *   PRISMIC_REPOSITORY_NAME         — repository identifier (e.g. big-emotion)
 *   PRISMIC_CUSTOM_TYPES_API_TOKEN  — write token (Bearer)
 *
 * Strategy:
 *   For each entity, POST /<kind>/insert first. On 409 (id exists) we fall back
 *   to POST /<kind>/update. The script never deletes remote entities — orphan
 *   detection is the job of `pnpm prismic:check`.
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
const repository = requirePrismicRepository();
const token = process.env.PRISMIC_CUSTOM_TYPES_API_TOKEN;

if (!token) {
  console.error(
    "prismic:push — PRISMIC_CUSTOM_TYPES_API_TOKEN is not set.\n" +
      "  Generate a write token in the Prismic dashboard → Settings → API & Security → Write APIs,\n" +
      "  then add it to .env (see .env.example).",
  );
  process.exit(1);
}

const HEADERS = buildCustomTypesHeaders(repository, token, { write: true });

const customTypes = loadEntitiesFromDir(resolve(root, "customtypes"), "index.json");
const slices = loadEntitiesFromDir(resolve(root, "src/slices"), "model.json");

let inserted = 0;
let updated = 0;
let failed = 0;

for (const customType of customTypes) {
  tally(await pushEntity("customtypes", customType), "custom type", customType.id);
}

for (const slice of slices) {
  tally(await pushEntity("slices", slice), "slice", slice.id);
}

console.log(
  `\nprismic:push — ${inserted} inserted, ${updated} updated, ${failed} failed ` +
    `(repo: ${repository})`,
);
process.exit(failed > 0 ? 1 : 0);

// ---

async function pushEntity(kind, body) {
  const insertRes = await fetch(`${CUSTOM_TYPES_API_BASE}/${kind}/insert`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body),
  });

  if (insertRes.status === 201) return { kind: "inserted" };

  if (insertRes.status === 409) {
    const updateRes = await fetch(`${CUSTOM_TYPES_API_BASE}/${kind}/update`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(body),
    });
    if (updateRes.status === 204) return { kind: "updated" };
    return {
      kind: "failed",
      step: "update",
      status: updateRes.status,
      message: await safeResponseText(updateRes),
    };
  }

  return {
    kind: "failed",
    step: "insert",
    status: insertRes.status,
    message: await safeResponseText(insertRes),
  };
}

function tally(result, label, id) {
  if (result.kind === "inserted") {
    inserted++;
    console.log(`  + ${label} "${id}" inserted`);
  } else if (result.kind === "updated") {
    updated++;
    console.log(`  ~ ${label} "${id}" updated`);
  } else {
    failed++;
    console.error(
      `  ! ${label} "${id}" — ${result.step} failed (HTTP ${result.status}): ${result.message}`,
    );
  }
}
