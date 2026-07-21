#!/usr/bin/env node
/**
 * Seed the Home page into an empty Prismic repository, one locale at a time. This is
 * the copy that used to live in `content[locale].scenes` in `src/content/site.ts`
 * before SWBE-81 moved the Home scroll spine to Prismic — kept here so a fresh
 * repository can be brought back to the state the site expects with one command
 * instead of authoring six slices by hand in the dashboard.
 *
 * It is NOT a migration and not part of the build: Prismic is the source of truth for
 * the Home page *content* once seeded, and editing afterwards happens in the dashboard.
 *
 * Usage:
 *   pnpm prismic:seed-home fr-fr
 *   pnpm prismic:seed-home en-us
 *
 * Required env:
 *   PRISMIC_REPOSITORY_NAME
 *   PRISMIC_CUSTOM_TYPES_API_TOKEN  (write scope)
 *
 * The Migration API refuses to create a document whose uid already exists in the
 * locale, so re-running against a seeded locale fails loudly rather than silently
 * duplicating. To rewrite the already-existing document instead, pass `--repair`:
 *
 *   pnpm prismic:seed-home en-us --repair
 *
 * Repair exists because the Migration API creates a document and then patches its
 * content in a second pass; when that second pass fails, the document survives as an
 * empty shell that only a rewrite can fix. It matches by uid, so it needs the document
 * published (the Content API cannot see drafts).
 *
 * The document lands UNPUBLISHED either way. Prismic exposes no publish endpoint, so
 * publishing is a dashboard step — and until it happens `/` and `/en` 404.
 */

import * as prismic from "@prismicio/client";

import { requirePrismicRepository } from "./lib/prismic-repository.mjs";

/**
 * The six `STATES` keyframes (`scene/states.ts`), in choreography order — required,
 * since a `home_scene` slice's rendering position is also its `ScenePanel` index.
 * `scripts/seed-home.test.mjs` guards this order against the canonical source.
 *
 * Only `intro` uses the `introHero` variation (its visible headline is the 3D
 * wordmark, not stacked copy); the rest use `default`. `heading` lines and the tags
 * page's headline slots share the DEC-023 ASCII-only rule; `body`/`tagline` are prose
 * and keep their accents.
 */
export const SEED_COPY = {
  "fr-fr": [
    {
      sceneId: "intro",
      variation: "introHero",
      tagline: "L'agence B!G qui fait dire wow.",
      body: "Big Emotion est un studio créatif digital first qui façonne des marques que l’on ressent avant même de les comprendre. Stratégie, design et motion, pensés pour émouvoir.",
    },
    {
      sceneId: "approach",
      variation: "default",
      heading: ["L'agence", "qui fait", "dire wow"],
      body: "On part de la réaction, puis on remonte tout le fil pour l’obtenir. Chaque scroll, chaque transition, chaque frame est un temps fort d’une histoire dont votre audience se souvient vraiment.",
      socialHandle: false,
    },
    {
      sceneId: "cases",
      variation: "default",
      heading: ["Derriere", "chaque clic,", "une emotion"],
      body: "Les interfaces sont des décisions émotionnelles déguisées. On dessine les micro instants, le poids d’un bouton, le timing d’une révélation, pour que l’intention devienne instinct.",
      socialHandle: false,
    },
    {
      sceneId: "culture",
      variation: "default",
      heading: ["Digital first,", "emotion", "toujours"],
      body: "Nés sur le web, obsédés par la performance. 3D temps réel, motion fluide et ingénierie accessible, un craft exigeant qui charge vite et passe partout.",
      socialHandle: false,
    },
    {
      sceneId: "louder",
      variation: "default",
      heading: ["Votre marque,", "en plus fort"],
      body: "Même ADN, plus de volume. On pousse le contraste, la confiance et le craft jusqu’à rendre votre marque impossible à ignorer, et impossible à oublier.",
      socialHandle: false,
    },
    {
      sceneId: "final",
      variation: "default",
      heading: ["On ne fait pas", "des sites,", "on cree de l'impact."],
      socialHandle: true,
    },
  ],
  "en-us": [
    {
      sceneId: "intro",
      variation: "introHero",
      tagline: "The B!G agency that gives a wow.",
      body: "Big Emotion is a digital first creative studio building brands that people feel before they understand. Strategy, design and motion, engineered to move.",
    },
    {
      sceneId: "approach",
      variation: "default",
      heading: ["The agency", "that gives", "a wow"],
      body: "We start with the reaction, then reverse engineer everything to get there. Every scroll, every transition, every frame is a deliberate beat in a story your audience actually remembers.",
      socialHandle: false,
    },
    {
      sceneId: "cases",
      variation: "default",
      heading: ["Behind", "every click,", "a feeling"],
      body: "Interfaces are emotional decisions in disguise. We design the micro moments, the weight of a button, the timing of a reveal, so intent turns into instinct.",
      socialHandle: false,
    },
    {
      sceneId: "culture",
      variation: "default",
      heading: ["Digital first", "emotion,", "always"],
      body: "Born on the web, obsessed with performance. Real time 3D, buttery motion and accessible engineering, heavy craft that still loads fast and scales everywhere.",
      socialHandle: false,
    },
    {
      sceneId: "louder",
      variation: "default",
      heading: ["Your brand,", "but louder"],
      body: "Same DNA, more volume. We turn up the contrast, the confidence and the craft until your brand is impossible to scroll past, and impossible to forget.",
      socialHandle: false,
    },
    {
      sceneId: "final",
      variation: "default",
      heading: ["We don't make", "websites,", "we create impact."],
      socialHandle: true,
    },
  ],
};

/** Shapes one seeded beat into the `home_scene` slice the Migration API accepts. */
function toSlice(scene) {
  if (scene.variation === "introHero") {
    return {
      slice_type: "home_scene",
      slice_label: null,
      variation: "introHero",
      primary: {
        scene_id: scene.sceneId,
        tagline: scene.tagline,
        body: scene.body ?? "",
      },
      items: [],
    };
  }

  return {
    slice_type: "home_scene",
    slice_label: null,
    variation: "default",
    primary: {
      scene_id: scene.sceneId,
      heading: scene.heading.map((line) => ({ line })),
      body: scene.body ?? "",
      social_handle: scene.socialHandle ?? false,
    },
    items: [],
  };
}

/** Shapes the seeded beats into the `page` document body the Migration API accepts. */
export function toDocument(scenes, lang) {
  return {
    type: "page",
    uid: "home",
    lang,
    data: {
      meta_title: "",
      meta_description: "",
      slices: scenes.map(toSlice),
    },
  };
}

async function run() {
  const lang = process.argv[2];
  const repair = process.argv.includes("--repair");
  const scenes = SEED_COPY[lang];

  if (!scenes) {
    console.error(
      `Usage: pnpm prismic:seed-home <lang> [--repair]\n` +
        `  Known locales: ${Object.keys(SEED_COPY).join(", ")}`,
    );
    process.exit(2);
  }

  const repository = requirePrismicRepository();
  const token = process.env.PRISMIC_CUSTOM_TYPES_API_TOKEN;

  if (!token) {
    console.error("prismic:seed-home — PRISMIC_CUSTOM_TYPES_API_TOKEN is not set.");
    process.exit(2);
  }

  const writeClient = prismic.createWriteClient(repository, { writeToken: token });

  if (repair) {
    await repairDocument(writeClient, repository, lang, scenes);
    return;
  }

  const migration = prismic.createMigration();
  migration.createDocument(toDocument(scenes, lang), "Home");
  await writeClient.migrate(migration);

  console.log(
    `\nprismic:seed-home — home page seeded in ${lang} (repo: ${repository}).\n` +
      `It is a draft: publish it in Prismic before the next build.`,
  );
}

/** Rewrites the already-published Home document of `lang` to match the seed copy. */
async function repairDocument(writeClient, repository, lang, scenes) {
  const readClient = prismic.createClient(repository, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });

  const existing = await readClient.getByUID("page", "home", { lang }).catch(() => null);
  if (!existing) {
    console.error(`  ! "home" has no published document in ${lang} — seed it first.`);
    return;
  }

  const { data } = toDocument(scenes, lang);
  await writeClient.updateDocument(existing.id, { documentTitle: "Home", uid: "home", data });

  console.log(
    `  ~ "home" rewritten in ${lang}\n\n` +
      `prismic:seed-home — home page repaired in ${lang}.\n` +
      `The rewrite is a draft: publish it in Prismic before the next build.`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await run();
}
