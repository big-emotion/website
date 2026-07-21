// Single source of truth for site copy, with one exception. Structured marketing data
// (services, productions, team) is typed here rather than in MDX: it's short and highly
// structured, so a typed module reads better and the components stay declarative.
//
// EXCEPT the case studies (SWBE-24) and the Home scroll spine (SWBE-81): both are
// Prismic content, fetched at build time — case studies by the /cases routes, the Home
// beats by the `page` (uid "home") document's Slice Zone. Everything else on those
// pages — the impact figures, the agency's own productions, the three subpage heroes
// under `sectionHeroes` — is still this module. Migrating the rest is deliberately a
// later decision, not an oversight.
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
// scroll cue, mission, stat.label, service titles, production titles/kinds,
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
   *  state and byline prefix are still site-wide UI copy, like the other section
   *  routes' leads above. */
  blog: { lead: string; emptyState: string; byline: string };
  services: readonly { title: string; body: string }[];
  impactStats: readonly { value: string; label: string }[];
  productionsIntro: { title: string; body: string };
  productions: readonly {
    slug: string;
    title: string;
    kind: string;
    summary: string;
    tags: readonly string[];
    links: readonly LinkOut[];
  }[];
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
export const socialHandle = "@bigemotionagency";

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
  productionsIntro: {
    title: "Nos productions maison",
    body: "Pas des commandes : nos propres projets, qu’on conçoit, qu’on héberge et qu’on fait vivre. Ils sont en ligne, va voir.",
  },
  productions: [
    {
      slug: "ethniafrica",
      title: "EthniAfrica",
      kind: "Produit",
      summary:
        "Le dictionnaire des ethnies africaines : les peuples des 55 pays du continent, leurs langues, leurs familles linguistiques. Conçu, développé et maintenu par nos soins — consultable en ligne comme en API.",
      tags: ["Produit", "Données", "API"],
      links: [
        { label: "ethniafrica.com", context: "sur le web", href: "https://ethniafrica.com/fr" },
      ],
    },
    {
      slug: "ferry",
      title: "Ferry",
      kind: "Open source",
      summary:
        "Une carte Jira change de colonne, une pull request relue arrive. Un pipeline d’agents qui tourne dans GitHub Actions — ni serveur, ni démon à héberger. Publié sous licence MIT, on s’en sert tous les jours.",
      tags: ["TypeScript", "GitHub Actions", "MIT"],
      links: [
        { label: "GitHub", context: "sur GitHub", href: "https://github.com/big-emotion/ferry" },
        {
          label: "npm",
          context: "sur npm",
          href: "https://www.npmjs.com/package/@big-emotion/ferry",
        },
      ],
    },
    {
      slug: "project-standard",
      title: "Project Standard",
      kind: "Outillage",
      summary:
        "Notre façon de monter un projet, empaquetée en plugin Claude Code : contrôles de CI, hooks de commit, skills maison, câblage Jira et Confluence. Une commande, et un repo neuf démarre déjà aux normes. Sous licence MIT.",
      tags: ["Claude Code", "Plugin", "CI/CD"],
      links: [
        {
          label: "GitHub",
          context: "sur GitHub",
          href: "https://github.com/big-emotion/project-standard",
        },
      ],
    },
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
  productionsIntro: {
    title: "Our own productions",
    body: "Not client work: our own projects, the ones we design, host and keep alive. They are online — go and look.",
  },
  productions: [
    {
      slug: "ethniafrica",
      title: "EthniAfrica",
      kind: "Product",
      summary:
        "The dictionary of African ethnic groups: the peoples of the continent’s 55 countries, their languages, their language families. Designed, built and maintained in-house — available on the web and as an API.",
      tags: ["Product", "Data", "API"],
      links: [
        { label: "ethniafrica.com", context: "on the web", href: "https://ethniafrica.com/fr" },
      ],
    },
    {
      slug: "ferry",
      title: "Ferry",
      kind: "Open source",
      summary:
        "A Jira card changes column, a reviewed pull request shows up. A pipeline of agents running inside GitHub Actions — no server, no daemon to host. Published under the MIT licence, and we use it every day.",
      tags: ["TypeScript", "GitHub Actions", "MIT"],
      links: [
        { label: "GitHub", context: "on GitHub", href: "https://github.com/big-emotion/ferry" },
        {
          label: "npm",
          context: "on npm",
          href: "https://www.npmjs.com/package/@big-emotion/ferry",
        },
      ],
    },
    {
      slug: "project-standard",
      title: "Project Standard",
      kind: "Tooling",
      summary:
        "The way we set a project up, packaged as a Claude Code plugin: CI checks, commit hooks, in-house skills, Jira and Confluence wiring. One command and a fresh repo already meets the standard. MIT licensed.",
      tags: ["Claude Code", "Plugin", "CI/CD"],
      links: [
        {
          label: "GitHub",
          context: "on GitHub",
          href: "https://github.com/big-emotion/project-standard",
        },
      ],
    },
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
