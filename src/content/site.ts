// Single source of truth for cross-site copy. Marketing strings live here (typed)
// so a non-page edit — a slogan, the phone number — is one obvious place to change.
// Long-form content (case studies, legal) will move to MDX in Phase 3.

export const site = {
  name: "BIG EMOTION",
  tagline: "The B!G agency that gives a wow.",
  baseline: "On ne fait pas des sites web. On crée de l'impact.",
  contact: {
    email: "contact@big-emotion.com",
    phone: "+33 7 03 676 43 22",
    phoneHref: "tel:+33703676432",
    social: "@big-emotion",
    person: "Jean-Noé Kollo",
  },
} as const;

// Order and labels come straight from the guidelines' website mock.
export const nav = [
  { label: "Approach", href: "/#approach" },
  { label: "Cases & Impact", href: "/#cases" },
  { label: "Culture", href: "/#culture" },
  { label: "Contact", href: "/#contact" },
] as const;

// Tone-of-voice lines from the brand book, reused as section punchlines.
export const manifesto = [
  "We don't make websites. We make impact.",
  "Digital is the medium. Emotion is the message.",
  "Big ideas. Bigger feelings.",
  "We build what people remember.",
  "We turn screens into experiences.",
  "Behind every click, a feeling.",
  "Your brand, but louder.",
] as const;
