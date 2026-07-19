// Single source of truth for site copy. Structured marketing data (services, cases,
// team) is typed here rather than in MDX: it's short and highly structured, so a typed
// module reads better and the components stay declarative. MDX is reserved for any
// future long-form content (a blog, deep case write-ups).

export const site = {
  name: "BIG EMOTION",
  tagline: "The B!G agency that gives a wow.",
  baseline: "On ne fait pas des sites web. On crée de l’impact.",
  mission: "Donner vie à tes projets et leur transmettre des émotions.",
  stat: { value: "50+", label: "projets accompagnés" },
  contact: {
    email: "contact@big-emotion.com",
    phone: "+33 7 03 676 43 22",
    // Keep the dialed digits identical to the displayed number above.
    phoneHref: "tel:+337036764322",
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

// The "Espace client" area is a separate app — the sibling support portal, which
// will grow into the espace/B2B space. It is not a section of this site, so it's an
// absolute link opened in a new tab, kept apart from the anchor `nav` above.
export const espaceClientCta = {
  label: "Espace client",
  href: "https://support.big-emotion.com/",
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
    title: "Étude, conception & réalisation",
    body: "Une méthodo qui cadre ton besoin au millimètre, puis on t’épaule de A à Z sur toute la technique — et même au-delà.",
  },
  {
    title: "Conseil & plan marketing",
    body: "Plus de cinquante projets au compteur. On met de l’émotion dans ta stratégie, pas du jargon.",
  },
  {
    title: "Développement sur-mesure",
    body: "Un cahier des charges précis, des modules conçus rien que pour toi. Ton projet, exactement comme tu le veux.",
  },
] as const;

// Real projects (clients + briefs from the existing case studies).
export const cases = [
  {
    slug: "mamiezi",
    client: "MAMIEZI",
    kind: "Marketplace e-tourisme",
    summary:
      "Le premier site d’e-tourisme dédié aux loisirs, excursions et activités sur le continent africain. Un catalogue d’expériences à vivre, réservables en quelques clics.",
    tags: ["UX/UI", "Réservation", "Responsive"],
  },
  {
    slug: "adolebatisseur",
    client: "AdoléBâtisseur",
    kind: "Site d’actualité",
    summary:
      "Un média pour informer les Ivoiriens des grands chantiers nationaux d’aménagement du territoire engagés par la présidence de Côte d’Ivoire.",
    tags: ["Éditorial", "Actu", "Responsive"],
  },
] as const;

// The people (names + the personality lines from the old "Les Membres" page).
export const team = [
  {
    name: "Jean-Noé Kollo",
    role: "Geek & philosophe",
    bio: "Il démarre toujours un projet par une citation d’auteur — histoire de donner le ton.",
  },
  {
    name: "Sylvain Seng Bandith",
    role: "Rêveur & pointilleux",
    bio: "Livrer avec une vision, sans rien lâcher sur la prod. Rêver et soigner le détail, pour lui ça va ensemble.",
  },
] as const;

// Brand values (brand book, tone-of-voice page).
export const values = [
  "Audace",
  "Sincérité",
  "Énergie",
  "Simplicité radicale",
  "Exigence créative",
] as const;
