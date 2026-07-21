#!/usr/bin/env node
/**
 * Fail when published Prismic content puts an accented character in a display slot.
 *
 * BBH Hegarty has an ASCII-only cmap (DEC-023): an accent falls back to another face
 * and renders visibly mismatched mid-word. `src/content/site.test.ts` already guards
 * the copy that lives in code, and `scripts/seed-home.test.mjs` guards the seeds — but
 * both note that Prismic itself cannot enforce the rule. Editor-authored articles were
 * the remaining hole, and shipped with `ARRÊTÉ` rendering in two different faces.
 *
 * The display slots on an `article` are its `title` and every `article_section`
 * heading — `.article-prose :where(h2, h3, h4)` resolves to `--font-display`
 * (src/app/globals.css). Body prose keeps correct French and is exempt.
 *
 * Required env:
 *   PRISMIC_REPOSITORY_NAME
 *   PRISMIC_ACCESS_TOKEN
 *
 * Exit codes:
 *   0 — every display slot is clean
 *   1 — accented display copy found
 *   2 — operational error (missing env, API unreachable)
 */

import * as prismic from "@prismicio/client";

/** Accented Latin letters — the same range site.test.ts and seed-home.test.mjs use. */
const ACCENTED = /[À-ſ]/;

function plainText(richText) {
  if (!Array.isArray(richText)) return "";
  return richText.map((block) => block.text ?? "").join(" ");
}

/**
 * Every display slot on one article document that contains an accented character.
 * Pure — the network lives in `main()` so this stays unit-testable.
 *
 * @returns {Array<{uid: string, lang: string, slot: string, text: string}>}
 */
export function accentedDisplayCopy(doc) {
  const slots = [{ slot: "title", text: doc.data.title ?? "" }];

  (doc.data.body ?? []).forEach((slice, index) => {
    slots.push({ slot: `body[${index}].heading`, text: plainText(slice.primary?.heading) });
  });

  return slots
    .filter(({ text }) => ACCENTED.test(text))
    .map(({ slot, text }) => ({ uid: doc.uid, lang: doc.lang, slot, text }));
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`${name} is not set. Copy .env.example to .env and fill it in.`);
    process.exit(2);
  }
  return value;
}

async function main() {
  const repository = requireEnv("PRISMIC_REPOSITORY_NAME");
  const accessToken = requireEnv("PRISMIC_ACCESS_TOKEN");
  const client = prismic.createClient(repository, {
    accessToken,
    fetchOptions: { cache: "no-store" },
  });

  let articles;
  try {
    articles = await client.getAllByType("article", { lang: "*" });
  } catch (error) {
    console.error(`Could not read articles from Prismic: ${error.message}`);
    process.exit(2);
  }

  const hits = articles.flatMap(accentedDisplayCopy);

  console.log(`\nChecking display slots on ${articles.length} published article(s)…\n`);
  for (const { uid, lang, slot, text } of hits) {
    console.log(`  ✗ ${uid} [${lang}] ${slot}\n      ${text}`);
  }

  if (hits.length > 0) {
    console.error(
      `\nprismic:check-display FAILED — ${hits.length} accented display slot(s) (repo: ${repository}).` +
        `\nDisplay type is ASCII-only (DEC-023). De-accent the text in Prismic; body prose stays accented.`,
    );
    process.exit(1);
  }

  console.log(`prismic:check-display OK — every display slot is ASCII (repo: ${repository}).`);
}

// Importing this module for its pure export must not fire the network call.
if (import.meta.url === `file://${process.argv[1]}`) await main();
