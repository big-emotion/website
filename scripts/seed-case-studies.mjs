#!/usr/bin/env node
/**
 * Seed the four sector case studies into an empty Prismic repository, one locale at a
 * time. This is the copy that used to live in `content[locale].cases` in
 * `src/content/site.ts` before SWBE-24 moved case studies to Prismic — kept here so a
 * fresh repository (a staging clone, a rebuilt production repo) can be brought back to
 * the state the site expects with one command instead of eight dashboard forms.
 *
 * It is NOT a migration and not part of the build: Prismic is the source of truth for
 * case study *content* once seeded, and editing afterwards happens in the dashboard.
 *
 * Usage:
 *   pnpm prismic:seed-cases fr-fr
 *   pnpm prismic:seed-cases en-us
 *
 * Required env:
 *   PRISMIC_REPOSITORY_NAME
 *   PRISMIC_CUSTOM_TYPES_API_TOKEN  (write scope)
 *
 * The Migration API refuses to create a document whose uid already exists in the
 * locale, so re-running against a seeded locale fails loudly rather than silently
 * duplicating. To rewrite already-existing documents instead, pass `--repair`:
 *
 *   pnpm prismic:seed-cases en-us --repair
 *
 * Repair exists because the Migration API creates a document and then patches its
 * content in a second pass; when that second pass fails, the document survives as an
 * empty shell that only a rewrite can fix. It matches documents by uid, so it needs
 * them published (the Content API cannot see drafts).
 *
 * Documents land UNPUBLISHED either way. Prismic exposes no publish endpoint, so
 * publishing is a dashboard step — and until it happens the /cases pages build with no
 * case studies at all.
 */

import * as prismic from "@prismicio/client";

import { requirePrismicRepository } from "./lib/prismic-repository.mjs";

/**
 * Sector-framed, not client-framed: most engagements ship under NDA, so each study
 * describes the nature of the work and `client` stays empty. Same uids across locales —
 * the locale switcher preserves the path, so a uid present in one locale only would 404
 * the moment a visitor switches language on a case study page.
 */
export const SEED_COPY = {
  "fr-fr": [
    {
      order: 10,
      uid: "industrie",
      title: "Industrie & B2B",
      kind: "Plateformes de marque",
      summary:
        "Sortir un groupe industriel du site-plaquette. On refond l’image en ligne et on la branche sur un vrai moteur de leads qualifiés.",
      tags: ["Refonte", "Génération de leads", "SEO"],
    },
    {
      order: 20,
      uid: "medias",
      title: "Medias & Edition",
      kind: "Audience & monetisation",
      summary:
        "Structurer l’acquisition éditoriale des grandes rédactions : formats, référencement, et des parcours qui retiennent le lecteur au lieu de le perdre.",
      tags: ["SEO éditorial", "Audience", "Data"],
    },
    {
      order: 30,
      uid: "marketplaces",
      title: "Marketplaces & E-commerce",
      kind: "Acquisition & conversion",
      summary:
        "Du premier clic à la commande. On repense le tunnel, on le teste, on le mesure — pour que le trafic payé arrête de fuir en route.",
      tags: ["UX/UI", "Conversion", "Growth"],
    },
    {
      order: 40,
      uid: "startups",
      title: "Startups & Scale-ups",
      kind: "Croissance",
      summary:
        "Poser la stratégie, l’identité et le produit d’une marque qui démarre, puis l’aider à scaler sans perdre ce qui la rendait singulière.",
      tags: ["Stratégie", "Branding", "Produit"],
    },
  ],
  "en-us": [
    {
      order: 10,
      uid: "industrie",
      title: "Industry & B2B",
      kind: "Brand platforms",
      summary:
        "Getting an industrial group out of the brochure-site era. We rebuild the online image and wire it to a real qualified-lead engine.",
      tags: ["Rebuild", "Lead generation", "SEO"],
    },
    {
      order: 20,
      uid: "medias",
      title: "Media & Publishing",
      kind: "Audience & monetisation",
      summary:
        "Structuring editorial acquisition for major newsrooms: formats, search, and journeys that hold the reader instead of losing them.",
      tags: ["Editorial SEO", "Audience", "Data"],
    },
    {
      order: 30,
      uid: "marketplaces",
      title: "Marketplaces & E-commerce",
      kind: "Acquisition & conversion",
      summary:
        "From the first click to the order. We rethink the funnel, test it, measure it — so paid traffic stops leaking on the way through.",
      tags: ["UX/UI", "Conversion", "Growth"],
    },
    {
      order: 40,
      uid: "startups",
      title: "Startups & Scale-ups",
      kind: "Growth",
      summary:
        "Setting the strategy, identity and product of a brand that is just starting out, then helping it scale without losing what made it singular.",
      tags: ["Strategy", "Branding", "Product"],
    },
  ],
};

/** Shapes one seed entry into the document body the Migration API accepts. */
export function toDocument(sector, lang) {
  return {
    type: "case_study",
    uid: sector.uid,
    lang,
    data: {
      title: sector.title,
      display_order: sector.order,
      kind: sector.kind,
      client: "",
      summary: [{ type: "paragraph", text: sector.summary, spans: [] }],
      tags: sector.tags.map((label) => ({ label })),
      // `cover` is deliberately absent: the Migration API rejects an explicit null for
      // an image field, and the seeds ship without artwork.
      body: [],
    },
  };
}

async function run() {
  const lang = process.argv[2];
  const repair = process.argv.includes("--repair");
  const sectors = SEED_COPY[lang];

  if (!sectors) {
    console.error(
      `Usage: pnpm prismic:seed-cases <lang> [--repair]\n` +
        `  Known locales: ${Object.keys(SEED_COPY).join(", ")}`,
    );
    process.exit(2);
  }

  const repository = requirePrismicRepository();
  const token = process.env.PRISMIC_CUSTOM_TYPES_API_TOKEN;

  if (!token) {
    console.error("prismic:seed-cases — PRISMIC_CUSTOM_TYPES_API_TOKEN is not set.");
    process.exit(2);
  }

  const writeClient = prismic.createWriteClient(repository, { writeToken: token });

  if (repair) {
    await repairDocuments(writeClient, repository, lang, sectors);
    return;
  }

  const migration = prismic.createMigration();
  for (const sector of sectors) {
    migration.createDocument(toDocument(sector, lang), sector.title);
  }
  await writeClient.migrate(migration);

  console.log(
    `\nprismic:seed-cases — ${sectors.length} case studies seeded in ${lang} (repo: ${repository}).\n` +
      `They are drafts: publish them in Prismic before the next build.`,
  );
}

/** Rewrites the already-published documents of `lang` to match the seed copy. */
async function repairDocuments(writeClient, repository, lang, sectors) {
  const readClient = prismic.createClient(repository, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });
  const idsByUID = new Map(
    (await readClient.getAllByType("case_study", { lang })).map((doc) => [doc.uid, doc.id]),
  );

  let repaired = 0;
  for (const sector of sectors) {
    const id = idsByUID.get(sector.uid);
    if (!id) {
      console.error(`  ! "${sector.uid}" has no published document in ${lang} — seed it first.`);
      continue;
    }
    const { data } = toDocument(sector, lang);
    await writeClient.updateDocument(id, { documentTitle: sector.title, uid: sector.uid, data });
    console.log(`  ~ "${sector.uid}" rewritten`);
    repaired++;
  }

  console.log(
    `\nprismic:seed-cases — ${repaired}/${sectors.length} case studies repaired in ${lang}.\n` +
      `The rewrites are drafts: publish them in Prismic before the next build.`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await run();
}
