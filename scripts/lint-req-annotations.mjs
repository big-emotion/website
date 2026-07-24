#!/usr/bin/env node
/**
 * Enforces local traceability between Confluence REQ-NNN contracts and tests.
 *
 * Whole-repo mode checks that:
 * - every @req annotation names a catalogued, non-obsolete requirement;
 * - every Implemented or Approved requirement appears in at least one test;
 * - every exported symbol whose JSDoc declares @req has a matching test.
 *
 * Staged mode additionally requires every new test definition to declare
 * `// @req REQ-NNN` inline or within the three preceding lines. Existing tests
 * are grandfathered by name so touching a legacy file does not force an
 * unrelated bulk rewrite.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(SCRIPT_PATH));
const CATALOG_PATH = join(ROOT, "docs/confluence-spec/req-catalog.json");
const CONFIG_PATH = join(ROOT, "docs/confluence-spec/config.json");

const SKIP_DIRS = new Set([".git", ".next", ".claude", "node_modules", "prismicio-types.d.ts"]);
const TEST_FILE_RE = /\.(?:test|spec)\.(?:ts|tsx|mjs|js)$/;
const SOURCE_FILE_RE = /\.(?:ts|tsx|mjs|js|jsx)$/;
const REQ_ANNOTATION_RE = /\/\/\s*@req\s+(REQ-\d{3})\b/g;
const REQ_JSDOC_RE = /\*\s*@req\s+(REQ-\d{3})\b/;
const DIRECT_TEST_RE =
  /^\s*(?:test|it)(?:\.(?:skip|todo|only|concurrent))?\s*\(\s*(?:'([^'\n]+)'|"([^"\n]+)"|`([^`\n]+)`)/;
const EACH_TEST_RE =
  /^\s*(?:test|it)\.each\s*\([^)]*\)\s*\(\s*(?:'([^'\n]+)'|"([^"\n]+)"|`([^`\n]+)`)/;

function isTestFile(path) {
  return TEST_FILE_RE.test(path);
}

function testNameOf(line) {
  const match = line.match(DIRECT_TEST_RE) ?? line.match(EACH_TEST_RE);
  if (!match) return null;
  return match[1] ?? match[2] ?? match[3] ?? null;
}

function testNames(content) {
  const names = new Set();
  for (const line of content.split("\n")) {
    const name = testNameOf(line);
    if (name) names.add(name);
  }
  return names;
}

/**
 * @param {string} content
 * @param {string} filePath
 * @param {string | undefined} priorContent
 * @returns {string[]}
 */
export function checkTestAnnotation(content, filePath, priorContent) {
  const errors = [];
  const lines = content.split("\n");
  const grandfathered = priorContent === undefined ? null : testNames(priorContent);

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] ?? "";
    const name = testNameOf(line);
    if (!name || grandfathered?.has(name)) continue;

    REQ_ANNOTATION_RE.lastIndex = 0;
    if (REQ_ANNOTATION_RE.test(line)) continue;

    let annotated = false;
    for (let previous = Math.max(0, index - 3); previous < index; previous++) {
      REQ_ANNOTATION_RE.lastIndex = 0;
      if (REQ_ANNOTATION_RE.test(lines[previous] ?? "")) {
        annotated = true;
        break;
      }
    }

    if (!annotated) {
      errors.push(
        `${filePath}:${index + 1}: missing @req annotation — add // @req REQ-NNN within 3 lines above this test`,
      );
    }
  }

  return errors;
}

/**
 * @param {{ path: string, content: string }[]} files
 * @returns {Set<string>}
 */
export function requirementIdsInTests(files) {
  const ids = new Set();

  for (const file of files) {
    if (!isTestFile(file.path)) continue;
    REQ_ANNOTATION_RE.lastIndex = 0;
    let match;
    while ((match = REQ_ANNOTATION_RE.exec(file.content)) !== null) {
      ids.add(match[1]);
    }
  }

  return ids;
}

function catalogEntries(catalog) {
  return Array.isArray(catalog?.requirements) ? catalog.requirements : [];
}

export function validateCatalog(catalog, requirementsPageId) {
  if (!catalog?.pageId || !Array.isArray(catalog.requirements)) {
    throw new Error("req-catalog.json must contain pageId and requirements");
  }
  if (String(catalog.pageId) !== String(requirementsPageId)) {
    throw new Error(
      `req-catalog.json pageId ${catalog.pageId} does not match config requirementsPageId ${requirementsPageId}`,
    );
  }

  const seen = new Set();
  let previousNumber = 0;
  for (const entry of catalog.requirements) {
    if (!/^REQ-\d{3}$/.test(entry.id ?? "")) {
      throw new Error(`invalid requirement id in catalog: ${String(entry.id)}`);
    }
    if (typeof entry.title !== "string" || !entry.title.trim()) {
      throw new Error(`${entry.id} must have a non-empty title`);
    }
    if (!["Pending", "Implemented", "Approved", "Obsolete"].includes(entry.status)) {
      throw new Error(`invalid status for ${entry.id}: ${String(entry.status)}`);
    }
    if (seen.has(entry.id)) {
      throw new Error(`duplicate requirement id in catalog: ${entry.id}`);
    }

    const number = Number(entry.id.slice(4));
    if (number <= previousNumber) {
      throw new Error("requirements must be ordered by increasing REQ-NNN ID");
    }
    previousNumber = number;
    seen.add(entry.id);
  }

  return catalog;
}

/**
 * @param {{ path: string, content: string }[]} files
 * @param {{ requirements?: { id: string, status: string }[] }} catalog
 * @returns {string[]}
 */
export function checkCatalogReferences(files, catalog) {
  const errors = [];
  const known = new Map(catalogEntries(catalog).map((entry) => [entry.id, entry]));

  for (const file of files) {
    const lines = file.content.split("\n");
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index] ?? "";
      REQ_ANNOTATION_RE.lastIndex = 0;
      let match;
      while ((match = REQ_ANNOTATION_RE.exec(line)) !== null) {
        const id = match[1];
        const entry = known.get(id);
        const column = match.index + match[0].lastIndexOf(id) + 1;
        if (!entry) {
          errors.push(
            `${file.path}:${index + 1}:${column}: @req ${id} is absent from docs/confluence-spec/req-catalog.json`,
          );
        } else if (entry.status === "Obsolete") {
          errors.push(
            `${file.path}:${index + 1}:${column}: @req ${id} references an Obsolete requirement`,
          );
        }
      }
    }
  }

  return errors;
}

/**
 * @param {{ path: string, content: string }[]} files
 * @param {{ requirements?: { id: string, status: string }[] }} catalog
 * @returns {string[]}
 */
export function checkImplementedCoverage(files, catalog) {
  const tested = requirementIdsInTests(files);
  return catalogEntries(catalog)
    .filter((entry) => entry.status === "Implemented" || entry.status === "Approved")
    .filter((entry) => !tested.has(entry.id))
    .map((entry) => `${entry.id} (${entry.status}) has no @req annotation in any test file`);
}

function nextNonBlankLine(lines, start) {
  for (let index = start; index < lines.length; index++) {
    if ((lines[index] ?? "").trim()) return index;
  }
  return -1;
}

function exportedRequirements(content) {
  const lines = content.split("\n");
  const matches = [];
  let inBlock = false;
  let blockId = null;
  let blockStart = -1;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] ?? "";
    const trimmed = line.trim();

    if (!inBlock && trimmed.startsWith("/**")) {
      inBlock = true;
      blockStart = index;
      blockId = trimmed.match(REQ_JSDOC_RE)?.[1] ?? null;
    } else if (inBlock && !blockId) {
      blockId = line.match(REQ_JSDOC_RE)?.[1] ?? null;
    }

    if (!inBlock || !trimmed.endsWith("*/")) continue;

    if (blockId) {
      const exportLine = nextNonBlankLine(lines, index + 1);
      if (exportLine !== -1 && /^\s*export\b/.test(lines[exportLine] ?? "")) {
        matches.push({ id: blockId, line: blockStart + 1 });
      }
    }

    inBlock = false;
    blockId = null;
    blockStart = -1;
  }

  return matches;
}

/**
 * @param {{ path: string, content: string }[]} files
 * @returns {string[]}
 */
export function checkExportTraceability(files) {
  const errors = [];
  const tested = requirementIdsInTests(files);

  for (const file of files) {
    if (!file.path.startsWith("src/") || !SOURCE_FILE_RE.test(file.path)) continue;
    for (const requirement of exportedRequirements(file.content)) {
      if (!tested.has(requirement.id)) {
        errors.push(
          `${file.path}:${requirement.line}: exported symbol annotated @req ${requirement.id} has no matching test annotation`,
        );
      }
    }
  }

  return errors;
}

function* walk(directory) {
  let entries;
  try {
    entries = readdirSync(directory);
  } catch {
    return;
  }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const fullPath = join(directory, entry);
    let stats;
    try {
      stats = statSync(fullPath);
    } catch {
      continue;
    }

    if (stats.isDirectory()) {
      yield* walk(fullPath);
    } else if (SOURCE_FILE_RE.test(entry) && !entry.endsWith(".d.ts")) {
      yield fullPath;
    }
  }
}

function readFiles(paths) {
  const files = [];
  for (const path of paths) {
    const fullPath = join(ROOT, path);
    if (!existsSync(fullPath)) continue;
    try {
      files.push({ path, content: readFileSync(fullPath, "utf8") });
    } catch {
      // Ignore unreadable files; the normal lint/build gates report them.
    }
  }
  return files;
}

function allFiles() {
  const files = [];
  for (const fullPath of walk(ROOT)) {
    const path = relative(ROOT, fullPath).replaceAll("\\", "/");
    try {
      files.push({ path, content: readFileSync(fullPath, "utf8") });
    } catch {
      // Ignore unreadable files; the normal lint/build gates report them.
    }
  }
  return files;
}

function stagedPaths() {
  try {
    return execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=AM"], {
      cwd: ROOT,
      encoding: "utf8",
    })
      .split("\n")
      .map((path) => path.trim().replaceAll("\\", "/"))
      .filter(Boolean)
      .filter((path) => SOURCE_FILE_RE.test(path));
  } catch {
    return [];
  }
}

function priorContent(path) {
  try {
    return execFileSync("git", ["show", `HEAD:${path}`], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return "";
  }
}

function loadCatalog() {
  if (!existsSync(CATALOG_PATH)) {
    throw new Error("docs/confluence-spec/req-catalog.json is missing");
  }
  if (!existsSync(CONFIG_PATH)) {
    throw new Error("docs/confluence-spec/config.json is missing");
  }

  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
  const config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
  if (!config.requirementsPageId) {
    throw new Error("config.json must contain requirementsPageId");
  }

  return validateCatalog(catalog, config.requirementsPageId);
}

function report(errors) {
  for (const error of errors) console.error(error);
  if (errors.length) {
    console.error(`\nlint:req — ${errors.length} violation(s) found`);
    process.exitCode = 1;
  } else {
    console.log("lint:req — OK (Confluence requirement traceability is complete)");
  }
}

function main() {
  const staged = process.argv.includes("--staged");
  let catalog;
  try {
    catalog = loadCatalog();
  } catch (error) {
    report([`lint:req: ${error.message}`]);
    return;
  }

  const repositoryFiles = allFiles();
  const traceabilityFiles = repositoryFiles.filter(
    (file) => file.path !== "scripts/lint-req-annotations.test.mjs",
  );
  const errors = [];

  if (staged) {
    const changedFiles = readFiles(stagedPaths());
    for (const file of changedFiles) {
      if (!isTestFile(file.path) || file.path.startsWith("scripts/")) continue;
      errors.push(checkTestAnnotation(file.content, file.path, priorContent(file.path)));
    }
    errors.push(checkCatalogReferences(changedFiles, catalog));
  } else {
    errors.push(checkCatalogReferences(traceabilityFiles, catalog));
    errors.push(checkImplementedCoverage(traceabilityFiles, catalog));
  }

  errors.push(checkExportTraceability(traceabilityFiles));
  report(errors.flat());
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === fileURLToPath(new URL(process.argv[1], "file://"))
) {
  main();
}
