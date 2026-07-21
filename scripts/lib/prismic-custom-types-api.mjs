/**
 * Shared helpers for Prismic Custom Types API consumers
 * (prismic-check, prismic-push, prismic-pull).
 *
 * Extracted to avoid duplicating the API root URL, header construction, local
 * directory scanning, and the response-body helper across the three scripts.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

export const CUSTOM_TYPES_API_BASE = "https://customtypes.prismic.io";

/**
 * Build request headers for the Prismic Custom Types API.
 * Pass `{ write: true }` for write endpoints (insert / update) that POST JSON.
 *
 * @param {string} repository Prismic repository name
 * @param {string} token      Bearer token (read or write scope)
 * @param {{ write?: boolean }} [options]
 * @returns {Record<string, string>}
 */
export function buildCustomTypesHeaders(repository, token, { write = false } = {}) {
  /** @type {Record<string, string>} */
  const headers = { Authorization: `Bearer ${token}`, repository };
  if (write) headers["Content-Type"] = "application/json";
  return headers;
}

/**
 * Load Prismic entities from a flat directory of subdirectories.
 * Each subdirectory that contains `filename` is treated as one entity.
 * Throws a SyntaxError if a file cannot be parsed — let the caller decide
 * whether to exit or continue.
 *
 * @param {string} dir       Absolute path to the directory to scan
 * @param {string} filename  File to read inside each subdirectory (e.g. "index.json", "model.json")
 * @returns {unknown[]}      Parsed JSON objects, one per matching subdirectory
 */
export function loadEntitiesFromDir(dir, filename) {
  if (!existsSync(dir)) return [];
  const entities = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    const filePath = join(full, filename);
    if (!existsSync(filePath)) continue;
    entities.push(JSON.parse(readFileSync(filePath, "utf8")));
  }
  return entities;
}

/**
 * Safely read the text body of a Response without throwing.
 * Returns "<no body>" when the body has already been consumed or is unavailable.
 *
 * @param {Response} res
 * @returns {Promise<string>}
 */
export async function safeResponseText(res) {
  try {
    return await res.text();
  } catch {
    return "<no body>";
  }
}
