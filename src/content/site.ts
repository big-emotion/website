// Single source of truth for site copy. Structured marketing data (services, cases,
// team) is typed here rather than in MDX: it's short and highly structured, so a typed
// module reads better and the components stay declarative. MDX is reserved for any
// future long-form content (a blog, deep case write-ups).
//
// ACCENTS: BBH Hegarty (the `font-display` face) ships an ASCII-only cmap — no
// é è à ç É. Any accented character in display type silently falls back to
// another font and renders visibly mismatched, so copy that lands in a
// `font-display` slot is written unaccented: mission, stat.label, service
// titles, case titles/kinds, impact labels, team names/roles, values. Body copy
// keeps correct French — Bricolage Grotesque covers the full range. Restore the
// accents here only once the display font gains the glyphs (DEC-023).
// `contact.person` is deliberately still accented: it feeds the schema.org
// founder, never display type, and it is a real person's name.

export const site = {
  name: "BIG EMOTION",
  tagline: "The B!G agency that gives a wow.",
  baseline: "On ne fait pas des sites web. On crée de l’impact.",
  mission: "Donner vie a tes projets et leur transmettre des emotions.",
  stat: { value: "50+", label: "projets accompagnes" },
  contact: {
    email: "hello@big-emotion.com",
    phone: "+33 7 66 26 40 43",
    // Keep the dialed digits identical to the displayed number above.
    phoneHref: "tel:+33766264043",
    social: "@big-emotion",
    person: "Jean-Noé Kollo",
    responseTime: "On te répond sous 24 h.",
  },
} as const;

// Order and labels come straight from the guidelines' website mock.
export const nav = [
  { label: "Approach", href: "/#approach" },
  { label: "Cases & Impact", href: "/#cases" },
  { label: "Culture", href: "/#culture" },
  { label: "Contact", href: "/#contact" },
] as const;

// The "Espace B2B" area is a separate app — the sibling B2B client space at
// b2b.big-emotion.com (renamed from the support portal). It is not a section of this
// site, so it's an absolute link opened in a new tab, kept apart from the anchor `nav` above.
export const espaceB2bCta = {
  label: "Espace B2B",
  href: "https://b2b.big-emotion.com/",
} as const;

// Tone-of-voice lines from the brand book, reused as section punchlines (English on
// purpose — the brand mixes EN punchlines with FR body).
export const manifesto = [
  "We don't make websites. We make impact.",
  "Digital is the medium. Emotion is the message.",
  "Big ideas. Bigger feelings.",
  "We build what people remember.",
  "We turn screens into experiences.",
  "Behind every click, a feeling.",
  "Your brand, but louder.",
] as const;

// What the agency actually does (from the old site, reframed in the brand voice).
export const services = [
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
] as const;

// Headline numbers carried over from the founders' track record. Deliberately does
// NOT restate the project count — `site.stat` already claims "50+" in the Approach
// section, and two different counts on one page would read as sloppy.
export const impactStats = [
  { value: "+150 %", label: "Croissance moyenne" },
  { value: "+10 ans", label: "D’experience" },
] as const;

// Cases are framed by sector, not by named client: most engagements ship under NDA
// and the brands themselves are credited in the `clients` wall instead. Each entry
// describes the nature of the work — no per-case figures we can't stand behind.
export const cases = [
  {
    slug: "industrie",
    title: "Industrie & B2B",
    kind: "Plateformes de marque",
    summary:
      "Sortir un groupe industriel du site-plaquette. On refond l’image en ligne et on la branche sur un vrai moteur de leads qualifiés.",
    tags: ["Refonte", "Génération de leads", "SEO"],
  },
  {
    slug: "medias",
    title: "Medias & Edition",
    kind: "Audience & monetisation",
    summary:
      "Structurer l’acquisition éditoriale des grandes rédactions : formats, référencement, et des parcours qui retiennent le lecteur au lieu de le perdre.",
    tags: ["SEO éditorial", "Audience", "Data"],
  },
  {
    slug: "marketplaces",
    title: "Marketplaces & E-commerce",
    kind: "Acquisition & conversion",
    summary:
      "Du premier clic à la commande. On repense le tunnel, on le teste, on le mesure — pour que le trafic payé arrête de fuir en route.",
    tags: ["UX/UI", "Conversion", "Growth"],
  },
  {
    slug: "startups",
    title: "Startups & Scale-ups",
    kind: "Croissance",
    summary:
      "Poser la stratégie, l’identité et le produit d’une marque qui démarre, puis l’aider à scaler sans perdre ce qui la rendait singulière.",
    tags: ["Stratégie", "Branding", "Produit"],
  },
] as const;

// What the agency builds and runs for itself, as opposed to the sector `cases` above,
// which stay unnamed because the engagements behind them are under NDA. These have no
// client to clear, so they carry the one thing the sector cards can't: a link you can
// click. `context` completes each accessible name — Ferry ships on two channels and
// "GitHub" alone would be ambiguous out of context (WCAG 2.4.4), same as `team` links.
export const productions = [
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
      { label: "npm", context: "sur npm", href: "https://www.npmjs.com/package/@big-emotion/ferry" },
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
] as const;

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

// The people (names + the personality lines from the old "Les Membres" page).
// `links` are public profiles the founders own; `label` is what the visitor reads and
// `context` completes the accessible name, so two links both labelled "LinkedIn" stay
// distinguishable out of context (WCAG 2.4.4).
export const team = [
  {
    name: "Jean-Noe Kollo",
    role: "Geek & philosophe",
    bio: "Il démarre toujours un projet par une citation d’auteur — histoire de donner le ton.",
    links: [
      { label: "LinkedIn", context: "sur LinkedIn", href: "https://www.linkedin.com/in/jnkollo/" },
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
] as const;

// Brand values (brand book, tone-of-voice page).
// Unaccented on purpose — see the display-font note at the top of this file.
export const values = [
  "Audace",
  "Sincerite",
  "Energie",
  "Simplicite radicale",
  "Exigence creative",
] as const;

// Brand personality slider (brand book, "Brand personality slider" page).
// `position` is the brand's static dot placement along each axis, 0 (start
// pole) to 100 (end pole), measured from the guideline artwork by locating
// the dot's pixel center relative to the line's endpoints. Two source labels
// were corrected from apparent typos in the guideline ("Coold" -> "Cold",
// "Detalied" -> "Detailed").
export const personalityAxes = [
  { start: "Formal", end: "Casual", position: 54 },
  { start: "Cold", end: "Warm", position: 35 },
  { start: "Serious", end: "Playful", position: 45 },
  { start: "Detailed", end: "Minimal", position: 63 },
  { start: "Corporate", end: "Friendly", position: 40 },
  { start: "Complex", end: "Simple", position: 54 },
] as const;
