// Single source of truth for site copy, with one exception. Structured marketing data
// (services, team) is typed here rather than in MDX: it's short and highly
// structured, so a typed module reads better and the components stay declarative.
//
// EXCEPT the case studies (SWBE-24) and the Home scroll spine (SWBE-81): both are
// Prismic content, fetched at build time — case studies by the /cases routes, the Home
// beats by the `page` (uid "home") document's Slice Zone. Everything else on those
// pages — the impact figures, the three subpage heroes under `sectionHeroes` — is still
// this module. The agency's own productions left it for Prismic articles, since they had
// outgrown a two-line card. Migrating the rest is deliberately a later decision.
//
// BILINGUAL (SWBE-21): everything a visitor reads lives under `content[locale]`;
// everything that is the same in both locales — the brand name, contact details, client
// names, the personality axes — stays at module level. next-intl's `messages/*.json`
// deliberately holds none of this: it carries UI affordances only (aria labels, form
// microcopy), and marketing copy stays here (ARCH-017, AGENTS.md).
//
// ACCENTS: BBH Hegarty (the `font-display` face) ships an ASCII-only cmap — no
// é è à ç É. Any accented character in display type silently falls back to
// another font and renders visibly mismatched, so copy that lands in a
// `font-display` slot is written unaccented: section-hero headlines, nav labels, the
// scroll cue, mission, stat.label, service titles,
// impact labels, team names/roles, values, the contact headline. Case study titles and
// the Home scroll spine's own headlines land in the same display slots but are
// authored in Prismic, where this test cannot reach them — see the accent warning in
// the AGENTS.md Prismic section.
// Body copy keeps correct French — Bricolage Grotesque covers the full range.
// Restore the accents here only once the display font gains the glyphs (DEC-023).
// `contact.person` is deliberately still accented: it feeds the schema.org
// founder, never display type, and it is a real person's name.
// `src/content/site.test.ts` enforces the split across both locales.

import type { Locale } from "@/i18n/locales";

/**
 * The Home scroll spine's own beats (its headline lines, body copy, tagline) moved to
 * Prismic as `home_scene` slices on the `page` (uid "home") document (SWBE-81). The
 * `approach`/`cases`/`culture` subpages, though, each reuse one beat's headline as
 * their own `<h1>` (SubpageHero) — that reuse predates this migration and is out of
 * this story's scope, so those three entries stay here rather than fetching the Home
 * document from three unrelated routes. `intro`, `louder` and `final` had no such
 * second consumer and are gone: their only home now is Prismic.
 */
type SectionHero = {
  id: "approach" | "cases" | "culture";
  /**
   * Headline, one entry per rendered line — the preview encoded these as `<br>` in
   * `js/i18n.js`; an array keeps the copy out of `dangerouslySetInnerHTML`.
   */
  title: readonly string[];
};

type LinkOut = {
  label: string;
  /** Completes the accessible name, so two links both labelled "LinkedIn" stay
   *  distinguishable out of context (WCAG 2.4.4). */
  context: string;
  href: string;
};

type LocaleContent = {
  meta: { title: string; description: string };
  nav: readonly { label: string; href: string }[];
  espaceB2bLabel: string;
  scrollCue: string;
  sectionHeroes: readonly SectionHero[];
  mission: string;
  stat: { value: string; label: string };
  /** Subpage intros, from the preview dictionary's `*.lead` keys. */
  leads: { approach: string; cases: string; culture: string };
  /** The /blog surface (REQ-028): its content lives in Prismic, but the lead, empty
   *  state, byline prefix and the index's own chrome are still site-wide UI copy, like
   *  the other section routes' leads above. `featuredLabel`/`readMore`/`postCount` sit
   *  in sans (tangerine/lemon) slots, not `font-display`, so they keep their accents. */
  blog: {
    lead: string;
    emptyState: string;
    byline: string;
    /** Eyebrow on the promoted lead article. */
    featuredLabel: string;
    /** CTA on the promoted lead article. */
    readMore: string;
    /** Hero count chip. The number is interpolated; the noun is chosen by the count. */
    postCount: { one: string; other: string };
  };
  /** The /playground surface (REQ-037): a gallery of living-space experiments. Cards
   *  fill in as each effect story ships (SWBE-210); until then the gallery shows
   *  `emptyState`, same contract as blog's own empty state. */
  playground: {
    lead: string;
    emptyState: string;
    /** Call to action on a gallery card (PG-03). `font-display` slot — ASCII only. */
    play: string;
    /** Back-to-gallery link on an effect's own page. */
    back: string;
    /** EffectStage's Suspense fallback while an effect's chunk is fetched (PG-18). */
    loading: string;
    /** The player share loop (REQ-038): native sheet + clipboard fallback. Sans-slot
     *  chrome, not `font-display`, so it keeps its accents. */
    share: {
      button: string;
      sharedToast: string;
      copiedToast: string;
      failedToast: string;
    };
    /** The collective counter chip (SWBE-216/REQ-042) — same `{count} {noun}` pattern
     *  as `blog.postCount`. Sans-slot chrome, not `font-display`, so it keeps its accents. */
    counter: { one: string; other: string };
    /** Celebration toast lead-in (SWBE-217/REQ-043), prefixed to the unlocked badge's
     *  own label — sans-slot chrome, not `font-display`, so it keeps its accents. */
    challengeUnlockedLead: string;
    /** One hidden-challenge badge per effect id (from `effects.ts`), SWBE-217/REQ-043.
     *  `label` lands in a `font-display` slot (`BadgeChip`) — keep unaccented (DEC-023).
     *  `unlockedShare` is the brag text `resolveShareText` hands to `shareEffect` once
     *  this browser has unlocked it. */
    badges: Record<string, { label: string; unlockedShare: string }>;
  };
  services: readonly { title: string; body: string }[];
  impactStats: readonly { value: string; label: string }[];
  team: readonly {
    name: string;
    role: string;
    bio: string;
    links: readonly LinkOut[];
  }[];
  values: readonly string[];
  contact: {
    title: readonly string[];
    lead: string;
    responseTime: string;
    socialSuffix: string;
  };
  notFound: { label: string; body: string; back: string };
  /** The manifesto line the footer signs off with, on every route. Body copy,
   *  so unlike the display slots it keeps its accents. */
  footerLegal: string;
};

// Locale-invariant. Contact details, the legal entity name and the founder's name read
// the same in both languages, so duplicating them per locale would only invite drift.
export const site = {
  name: "BIG EMOTION",
  contact: {
    email: "hello@big-emotion.com",
    phone: "+33 7 66 26 40 43",
    // Keep the dialed digits identical to the displayed number above.
    phoneHref: "tel:+33766264043",
    person: "Jean-Noé Kollo",
  },
} as const;

/** The handle shown on the closing scene. Social profile URLs are still pending from
 *  the owner (SWBE-18 precondition 4), so the closing scene renders the handle as plain
 *  text and nothing there is clickable until real hrefs exist. */
export const socialHandle = "@bigemotion";

// The "Espace B2B" area is a separate app — the sibling B2B client space at
// b2b.big-emotion.com (renamed from the support portal). It is not a section of this
// site, so it's an absolute link opened in a new tab, and it is never locale-routed.
export const espaceB2bHref = "https://b2b.big-emotion.com/";

// Brands the founders have worked with, rendered as typographic wordmarks rather than
// logo files: no third-party asset licensing, no mismatched formats, and the wall
// inherits the brand's display type instead of fifteen competing ones.
export const clients = [
  "Michelin",
  "AXA",
  "Orange",
  "TF1",
  "BNP Paribas",
  "Radio France",
  "Les Echos",
  "Prisma Media",
  "Vallourec",
  "Ornikar",
  "Swapcard",
  "Agryco",
  "Cromology",
  "Funecap",
  "Mamiezi",
] as const;

// Brand personality slider (brand book, "Brand personality slider" page).
// `position` is the brand's static dot placement along each axis, 0 (start
// pole) to 100 (end pole), measured from the guideline artwork by locating
// the dot's pixel center relative to the line's endpoints. Two source labels
// were corrected from apparent typos in the guideline ("Coold" -> "Cold",
// "Detalied" -> "Detailed"). The poles are the brand book's own English
// vocabulary and stay untranslated in both locales.
export const personalityAxes = [
  { start: "Formal", end: "Casual", position: 54 },
  { start: "Cold", end: "Warm", position: 35 },
  { start: "Serious", end: "Playful", position: 45 },
  { start: "Detailed", end: "Minimal", position: 63 },
  { start: "Corporate", end: "Friendly", position: 40 },
  { start: "Complex", end: "Simple", position: 54 },
] as const;

const fr: LocaleContent = {
  meta: {
    title: "BIG EMOTION — L'agence B!G qui fait dire wow.",
    description:
      "On ne fait pas des sites web. On crée de l’impact. Agence digitale : vraie identité, émotion brute.",
  },
  nav: [
    { label: "Approche", href: "/approach" },
    { label: "References & Impact", href: "/cases" },
    { label: "Culture", href: "/culture" },
    { label: "Blog", href: "/blog" },
    { label: "Playground", href: "/playground" },
    { label: "Contact", href: "/contact" },
  ],
  espaceB2bLabel: "Espace B2B",
  scrollCue: "Defiler",
  sectionHeroes: [
    { id: "approach", title: ["L'agence", "qui fait", "dire wow"] },
    { id: "cases", title: ["Derriere", "chaque clic,", "une emotion"] },
    { id: "culture", title: ["Digital first,", "emotion", "toujours"] },
  ],
  mission: "Donner vie a tes projets et leur transmettre des emotions.",
  stat: { value: "50+", label: "projets accompagnes" },
  leads: {
    approach:
      "On part de la réaction, puis on remonte tout le fil pour l’obtenir. Stratégie, design et motion en un seul système, pour que chaque scroll, transition et frame soit un temps fort d’une histoire mémorable.",
    cases:
      "Une sélection de projets où le craft rencontre les chiffres. Des pics de lancement aux courbes de rétention, c’est ici qu’on montre les projets et l’impact qu’ils ont généré.",
    culture:
      "Nés sur le web, obsédés par la performance. 3D temps réel, motion fluide et ingénierie accessible, un craft exigeant qui charge vite. Voici l’équipe et les principes derrière.",
  },
  blog: {
    lead: "Ce qu’on apprend en construisant, écrit chez nous plutôt que sur LinkedIn ou Medium.",
    emptyState: "Aucun article pour le moment. Revenez bientôt.",
    byline: "Par",
    featuredLabel: "À la une",
    readMore: "Lire l’article",
    postCount: { one: "article", other: "articles" },
  },
  playground: {
    lead: "Un espace vivant où on teste les effets avant qu’ils passent en production. Les cartes arrivent projet par projet.",
    emptyState: "Aucune expérience pour le moment. Revenez bientôt.",
    play: "Jouer",
    back: "Retour au Playground",
    loading: "Chargement de l'expérience…",
    share: {
      button: "Partager",
      sharedToast: "Merci du partage !",
      copiedToast: "Lien copié dans le presse-papiers.",
      failedToast: "Impossible de partager pour le moment.",
    },
    counter: { one: "partie jouée", other: "parties jouées" },
    challengeUnlockedLead: "Défi secret débloqué :",
    badges: {
      lumiere: {
        label: "PLEIN SOLEIL",
        unlockedShare: "J'ai débloqué le badge PLEIN SOLEIL sur le Playground BIG EMOTION !",
      },
      "poids-lourd": {
        label: "GROS BRAS",
        unlockedShare: "J'ai débloqué le badge GROS BRAS sur le Playground BIG EMOTION !",
      },
      "big-bang": {
        label: "TIMING PARFAIT",
        unlockedShare: "J'ai débloqué le badge TIMING PARFAIT sur le Playground BIG EMOTION !",
      },
    },
  },
  services: [
    {
      title: "Etude, conception & realisation",
      body: "Une méthodo qui cadre ton besoin au millimètre, puis on t’épaule de A à Z sur toute la technique — et même au-delà.",
    },
    {
      title: "Conseil & plan marketing",
      body: "Plus de cinquante projets au compteur. On met de l’émotion dans ta stratégie, pas du jargon.",
    },
    {
      title: "Developpement sur-mesure",
      body: "Un cahier des charges précis, des modules conçus rien que pour toi. Ton projet, exactement comme tu le veux.",
    },
  ],
  impactStats: [
    { value: "+150 %", label: "Croissance moyenne" },
    { value: "+10 ans", label: "D’experience" },
  ],
  team: [
    {
      name: "Jean-Noe Kollo",
      role: "Geek & philosophe",
      bio: "Il démarre toujours un projet par une citation d’auteur — histoire de donner le ton.",
      links: [
        {
          label: "LinkedIn",
          context: "sur LinkedIn",
          href: "https://www.linkedin.com/in/jnkollo/",
        },
        { label: "Malt", context: "sur Malt", href: "https://www.malt.fr/profile/jeannoekollo" },
      ],
    },
    {
      name: "Sylvain Seng Bandith",
      role: "Reveur & pointilleux",
      bio: "Livrer avec une vision, sans rien lâcher sur la prod. Rêver et soigner le détail, pour lui ça va ensemble.",
      links: [
        {
          label: "sylvainsengbandith.fr",
          context: "sur son site",
          href: "https://www.sylvainsengbandith.fr/",
        },
        {
          label: "LinkedIn",
          context: "sur LinkedIn",
          href: "https://fr.linkedin.com/in/sylvain-sengbandith-83515b28",
        },
      ],
    },
  ],
  values: ["Audace", "Sincerite", "Energie", "Simplicite radicale", "Exigence creative"],
  contact: {
    title: ["Creons de la", "big emotion"],
    lead: "Une marque qui mérite d’être plus forte ? Dites ce que vous construisez.",
    responseTime: "On te répond sous 24 h.",
    socialSuffix: "sur les réseaux",
  },
  notFound: {
    label: "Erreur 404",
    body: "Cette page a disparu. L’émotion, elle, est toujours là.",
    back: "Retour a l'accueil",
  },
  footerLegal: "On ne fait pas des sites, on crée de l’impact.",
};

const en: LocaleContent = {
  meta: {
    title: "BIG EMOTION — The B!G agency that gives a wow.",
    description:
      "We don’t make websites. We make impact. Digital agency: real identity, raw emotion.",
  },
  nav: [
    { label: "Approach", href: "/approach" },
    { label: "Cases & Impact", href: "/cases" },
    { label: "Culture", href: "/culture" },
    { label: "Blog", href: "/blog" },
    { label: "Playground", href: "/playground" },
    { label: "Contact", href: "/contact" },
  ],
  espaceB2bLabel: "B2B Space",
  scrollCue: "Scroll",
  sectionHeroes: [
    { id: "approach", title: ["The agency", "that gives", "a wow"] },
    { id: "cases", title: ["Behind", "every click,", "a feeling"] },
    { id: "culture", title: ["Digital first", "emotion,", "always"] },
  ],
  mission: "Bring your projects to life and make them felt.",
  stat: { value: "50+", label: "projects delivered" },
  leads: {
    approach:
      "We start with the reaction, then reverse engineer everything to get there. Strategy, design and motion working as one system, so every scroll, transition and frame is a deliberate beat in a story your audience actually remembers.",
    cases:
      "Selected work where craft met numbers. From launch spikes to retention curves, this is where we show the projects and the impact they moved.",
    culture:
      "Born on the web, obsessed with performance. Real time 3D, buttery motion and accessible engineering, heavy craft that still loads fast. This is the team and the principles behind it.",
  },
  blog: {
    lead: "What we learn while building, written on our own domain instead of LinkedIn or Medium.",
    emptyState: "No articles yet. Check back soon.",
    byline: "By",
    featuredLabel: "Featured",
    readMore: "Read the article",
    postCount: { one: "post", other: "posts" },
  },
  playground: {
    lead: "A living space where we test effects before they ship in production. Cards land project by project.",
    emptyState: "No experiments yet. Check back soon.",
    play: "Play",
    back: "Back to Playground",
    loading: "Loading the experiment…",
    share: {
      button: "Share",
      sharedToast: "Thanks for sharing!",
      copiedToast: "Link copied to your clipboard.",
      failedToast: "Couldn't share this right now.",
    },
    counter: { one: "play", other: "plays" },
    challengeUnlockedLead: "Secret challenge unlocked:",
    badges: {
      lumiere: {
        label: "PLEIN SOLEIL",
        unlockedShare: "I just unlocked the PLEIN SOLEIL badge on the BIG EMOTION Playground!",
      },
      "poids-lourd": {
        label: "GROS BRAS",
        unlockedShare: "I just unlocked the GROS BRAS badge on the BIG EMOTION Playground!",
      },
      "big-bang": {
        label: "TIMING PARFAIT",
        unlockedShare: "I just unlocked the TIMING PARFAIT badge on the BIG EMOTION Playground!",
      },
    },
  },
  services: [
    {
      title: "Research, design & delivery",
      body: "A method that frames what you need down to the millimetre, then we back you from A to Z on everything technical — and well past it.",
    },
    {
      title: "Strategy & marketing plan",
      body: "More than fifty projects behind us. We put emotion into your strategy, not jargon.",
    },
    {
      title: "Custom development",
      body: "A precise brief, modules built for you and nobody else. Your project, exactly the way you want it.",
    },
  ],
  impactStats: [
    { value: "+150 %", label: "Average growth" },
    { value: "+10 yrs", label: "Of experience" },
  ],
  team: [
    {
      name: "Jean-Noe Kollo",
      role: "Geek & philosopher",
      bio: "He always opens a project with a quote from some author — just to set the tone.",
      links: [
        {
          label: "LinkedIn",
          context: "on LinkedIn",
          href: "https://www.linkedin.com/in/jnkollo/",
        },
        { label: "Malt", context: "on Malt", href: "https://www.malt.fr/profile/jeannoekollo" },
      ],
    },
    {
      name: "Sylvain Seng Bandith",
      role: "Dreamer & stickler",
      bio: "Ship with a vision, without giving an inch on production. Dreaming and sweating the detail go together, the way he sees it.",
      links: [
        {
          label: "sylvainsengbandith.fr",
          context: "on his site",
          href: "https://www.sylvainsengbandith.fr/",
        },
        {
          label: "LinkedIn",
          context: "on LinkedIn",
          href: "https://fr.linkedin.com/in/sylvain-sengbandith-83515b28",
        },
      ],
    },
  ],
  values: ["Boldness", "Sincerity", "Energy", "Radical simplicity", "Creative rigour"],
  contact: {
    title: ["Let's make", "big emotion"],
    lead: "Got a brand that deserves to be louder? Tell us what you’re building.",
    responseTime: "We reply within 24 h.",
    socialSuffix: "on socials",
  },
  notFound: {
    label: "Error 404",
    body: "This page is gone. The emotion is still here.",
    back: "Back to home",
  },
  footerLegal: "We don’t make websites, we create impact.",
};

export const content: Record<Locale, LocaleContent> = { fr, en };
