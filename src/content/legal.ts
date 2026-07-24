// Legal copy, kept out of `site.ts` on purpose.
//
// `site.ts` is marketing copy a reader scans; this is long-form prose a reader consults
// once. Mixing them would triple that module's length for content no marketing page ever
// renders. The AGENTS.md rule ("all copy lives in src/content") still holds — this is a
// sibling module inside it, which is also where AGENTS.md always said long-form legal
// content would land.
//
// AUTHORITY: Prismic owns the published wording (`legal_page` documents, SWBE-34). What
// follows is the **mandatory minimum** rendered when no document exists yet or an editor
// has emptied one — a legal page that silently degrades to a blank surface is worse than
// a plain one, because the obligation it discharges does not pause while the CMS is
// empty. `legal-body.ts` decides which of the two a request gets.
//
// ACCENTS: unlike `site.ts` these strings are never set in `font-display`. Legal titles
// have to read "Mentions légales", not "Mentions legales", and BBH Hegarty has no é
// (DEC-023) — so the legal routes render in the body face, which covers full French.

import type { Locale } from "@/i18n/locales";

export const LEGAL_UIDS = [
  "mentions-legales",
  "politique-de-confidentialite",
  "accessibilite",
] as const;

export type LegalUid = (typeof LEGAL_UIDS)[number];

/**
 * The registered facts, verified against the RNE/RCS entry for SIREN 983 423 351.
 *
 * Locale-invariant: a company's legal identity does not translate. Only the *labels*
 * around these values differ per language.
 *
 * Deliberately absent: the president's home address and date of birth. They appear in the
 * public registry, LCEN art. 6-III does not ask for them, and publishing a private
 * individual's residence is a data-minimisation failure — the registered office is the
 * address the law wants.
 */
export const legalEntity = {
  name: "BIG EMOTION",
  /** Legal form spelled out; "SASU" alone is an abbreviation readers may not expand. */
  form: "SASU (société par actions simplifiée à associé unique)",
  capital: "500 €",
  siren: "983 423 351",
  rcs: "983 423 351 R.C.S. Paris",
  vatNumber: "FR30983423351",
  address: "14 rue Bausset, 75015 Paris, France",
  publicationDirector: "Jean-Noé Kollo",
  /** Matches ADR 0003 / ADR 0005: a Docker container on an OVH VPS. */
  host: {
    name: "OVH SAS",
    address: "2 rue Kellermann, 59100 Roubaix, France",
    url: "https://www.ovhcloud.com",
  },
  cnil: {
    name: "Commission nationale de l'informatique et des libertés (CNIL)",
    address: "3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07",
    url: "https://www.cnil.fr",
  },
} as const;

/** A run of paragraphs under one subheading. */
type LegalSection = {
  heading: string;
  paragraphs: readonly string[];
};

type LegalDocument = {
  title: string;
  /** Meta description, and the lead paragraph under the title. */
  summary: string;
  sections: readonly LegalSection[];
};

/**
 * The date the fallback wording below was last revised. Prismic documents carry their own
 * `updated_at`; this one only applies while the fallback is what renders.
 */
export const LEGAL_FALLBACK_UPDATED_AT = "2026-07-24";

const contactEmail = "hello@big-emotion.com";

const fr: Record<LegalUid, LegalDocument> = {
  "mentions-legales": {
    title: "Mentions légales",
    summary: "Informations légales relatives à l'éditeur et à l'hébergeur du site big-emotion.com.",
    sections: [
      {
        heading: "Éditeur du site",
        paragraphs: [
          `${legalEntity.name}, ${legalEntity.form} au capital de ${legalEntity.capital}.`,
          `Siège social : ${legalEntity.address}.`,
          `Immatriculée au registre du commerce et des sociétés sous le numéro ${legalEntity.rcs}.`,
          `Numéro de TVA intracommunautaire : ${legalEntity.vatNumber}.`,
          `Contact : ${contactEmail}.`,
        ],
      },
      {
        heading: "Directeur de la publication",
        paragraphs: [`${legalEntity.publicationDirector}, président.`],
      },
      {
        heading: "Hébergeur",
        paragraphs: [
          `Le site est hébergé par ${legalEntity.host.name}, ${legalEntity.host.address} (${legalEntity.host.url}).`,
        ],
      },
      {
        heading: "Propriété intellectuelle",
        paragraphs: [
          "L'ensemble du site — sa structure, ses textes, son identité visuelle, ses animations et son code — est protégé par le droit de la propriété intellectuelle. Toute reproduction ou représentation, totale ou partielle, sans autorisation écrite préalable est interdite.",
          "Les marques et logos des clients cités le sont à titre de référence commerciale et restent la propriété de leurs titulaires respectifs.",
        ],
      },
      {
        heading: "Données personnelles et cookies",
        paragraphs: [
          "Le traitement des données personnelles et l'usage des cookies sont décrits dans la politique de confidentialité, accessible depuis le pied de page de chaque page du site.",
        ],
      },
    ],
  },

  "politique-de-confidentialite": {
    title: "Politique de confidentialité",
    summary:
      "Quelles données personnelles le site collecte, pourquoi, combien de temps, et comment exercer tes droits.",
    sections: [
      {
        heading: "Responsable du traitement",
        paragraphs: [
          `${legalEntity.name}, ${legalEntity.address}. Pour toute question sur tes données : ${contactEmail}.`,
        ],
      },
      {
        heading: "Formulaire de contact",
        paragraphs: [
          "Les champs du formulaire — nom, adresse e-mail et message — servent uniquement à répondre à ta demande. La base légale est l'exécution de mesures précontractuelles prises à ta demande, ou notre intérêt légitime à répondre à une sollicitation.",
          "Le message est transmis par e-mail à l'agence : il n'est enregistré dans aucune base de données par le site. Il reste ensuite dans notre messagerie le temps de la relation commerciale, puis il est supprimé.",
          "L'adresse IP de l'expéditeur est utilisée de façon éphémère et en mémoire vive, pour limiter le nombre d'envois et bloquer les abus. Elle n'est ni écrite sur disque ni conservée après le redémarrage du service.",
        ],
      },
      {
        heading: "Espace client",
        paragraphs: [
          "L'accès à l'espace client repose sur un lien de connexion à usage unique envoyé par e-mail. Les données traitées sont l'adresse e-mail professionnelle du client et un cookie de session qui te garde connecté.",
          "Ces données servent exclusivement à authentifier l'accès. Le lien de connexion expire au bout de quinze minutes ; la session expire au bout de trente jours.",
        ],
      },
      {
        heading: "Destinataires et sous-traitants",
        paragraphs: [
          `Hébergement du site : ${legalEntity.host.name} (${legalEntity.host.address}), au sein de l'Union européenne.`,
          "Acheminement des e-mails : Microsoft Ireland Operations Limited, via Microsoft 365, pour l'envoi des messages du formulaire de contact et des liens de connexion.",
          "Gestion du contenu éditorial : Prismic, qui héberge les textes publiés du site. Aucune donnée de visiteur ne lui est transmise.",
          "Aucune donnée personnelle n'est vendue, louée ou cédée à des tiers.",
        ],
      },
      {
        heading: "Cookies",
        paragraphs: [
          "Le site ne dépose aucun cookie publicitaire et n'utilise aucun traceur de mesure d'audience tiers. Les polices de caractères sont hébergées sur nos propres serveurs, ce qui évite toute requête vers un service externe lors de la simple consultation du site.",
          "Deux cookies strictement nécessaires peuvent être déposés : « espace_session », qui te garde connecté à l'espace client pendant trente jours, et « bigemotion_consent », qui mémorise tes choix en matière de cookies pendant douze mois. Un cookie strictement nécessaire ne demande pas de consentement préalable.",
          "Tu peux consulter et modifier tes choix à tout moment avec le bouton « Gestion des cookies », dans le pied de page.",
        ],
      },
      {
        heading: "Tes droits",
        paragraphs: [
          "Tu disposes d'un droit d'accès, de rectification, d'effacement, d'opposition, de limitation du traitement et de portabilité de tes données.",
          `Pour les exercer, écris à ${contactEmail}. On te répond sous un mois.`,
          `Si la réponse ne te satisfait pas, tu peux déposer une réclamation auprès de la ${legalEntity.cnil.name}, ${legalEntity.cnil.address} (${legalEntity.cnil.url}).`,
        ],
      },
    ],
  },

  accessibilite: {
    title: "Déclaration d'accessibilité",
    summary:
      "Où en est l'accessibilité du site big-emotion.com, ce qui est déjà en place, et comment nous signaler un obstacle.",
    sections: [
      {
        heading: "Notre engagement",
        paragraphs: [
          "Nous concevons des sites destinés à être utilisés par tout le monde, et nous appliquons la même exigence au nôtre. Cette déclaration décrit l'état réel de l'accessibilité de big-emotion.com, sans le surestimer.",
        ],
      },
      {
        heading: "État de conformité",
        paragraphs: [
          "Le site n'a pas fait l'objet d'un audit d'accessibilité par un tiers. Nous ne revendiquons donc aucun taux de conformité au RGAA ni aux WCAG : annoncer un pourcentage sans audit n'aurait aucune valeur.",
          "En tant qu'entreprise privée, nous ne sommes pas soumis à l'obligation de déclaration de conformité qui pèse sur les organismes publics. Cette déclaration est volontaire.",
        ],
      },
      {
        heading: "Ce qui est en place",
        paragraphs: [
          "Un lien d'évitement permet d'atteindre directement le contenu principal au clavier, et la langue de chaque page est déclarée pour les lecteurs d'écran.",
          "Les animations et le défilement animé se coupent dès que ton système signale une préférence pour un mouvement réduit.",
          "Les couleurs de la charte sont associées de manière à préserver le contraste entre le texte et son fond.",
        ],
      },
      {
        heading: "Limites connues",
        paragraphs: [
          "La page d'accueil repose sur une scène en trois dimensions liée au défilement. Son contenu est doublé en texte accessible, mais l'expérience visuelle qu'elle procure n'a pas d'équivalent non graphique.",
          "Certains contenus sont publiés par nos clients ou par notre équipe éditoriale : la qualité des textes de remplacement des images qu'ils déposent dépend de leur saisie.",
        ],
      },
      {
        heading: "Signaler un problème",
        paragraphs: [
          `Si tu rencontres un obstacle, écris-nous à ${contactEmail} avec la page concernée et la difficulté rencontrée. On te répond, et on corrige ce qui peut l'être.`,
        ],
      },
    ],
  },
};

const en: Record<LegalUid, LegalDocument> = {
  "mentions-legales": {
    title: "Legal notice",
    summary: "Publisher and hosting information for big-emotion.com.",
    sections: [
      {
        heading: "Publisher",
        paragraphs: [
          `${legalEntity.name}, a French simplified joint-stock company with a single shareholder (SASU), share capital ${legalEntity.capital}.`,
          `Registered office: ${legalEntity.address}.`,
          `Registered with the Paris trade and companies register under number ${legalEntity.siren}.`,
          `EU VAT number: ${legalEntity.vatNumber}.`,
          `Contact: ${contactEmail}.`,
        ],
      },
      {
        heading: "Director of publication",
        paragraphs: [`${legalEntity.publicationDirector}, President.`],
      },
      {
        heading: "Hosting",
        paragraphs: [
          `This site is hosted by ${legalEntity.host.name}, ${legalEntity.host.address} (${legalEntity.host.url}).`,
        ],
      },
      {
        heading: "Intellectual property",
        paragraphs: [
          "The entire site — its structure, copy, visual identity, animations and code — is protected by intellectual property law. Reproducing or displaying any part of it without prior written permission is prohibited.",
          "Client trademarks and logos are cited as commercial references and remain the property of their respective owners.",
        ],
      },
      {
        heading: "Personal data and cookies",
        paragraphs: [
          "How personal data is processed and which cookies are used is described in the privacy policy, linked from the footer of every page.",
        ],
      },
    ],
  },

  "politique-de-confidentialite": {
    title: "Privacy policy",
    summary:
      "What personal data this site collects, why, for how long, and how to exercise your rights.",
    sections: [
      {
        heading: "Data controller",
        paragraphs: [
          `${legalEntity.name}, ${legalEntity.address}. For any question about your data: ${contactEmail}.`,
        ],
      },
      {
        heading: "Contact form",
        paragraphs: [
          "The form fields — name, email address and message — are used solely to answer your enquiry. The legal basis is the performance of pre-contractual steps taken at your request, or our legitimate interest in replying to it.",
          "Your message is delivered to us by email; the site stores it in no database. It then remains in our mailbox for the duration of the business relationship and is deleted afterwards.",
          "The sender's IP address is held briefly in memory to cap how many messages can be sent and to block abuse. It is never written to disk and does not survive a restart of the service.",
        ],
      },
      {
        heading: "Client area",
        paragraphs: [
          "Access to the client area relies on a single-use sign-in link sent by email. The data processed is the client's work email address and a session cookie that keeps you signed in.",
          "It is used for authentication only. The sign-in link expires after fifteen minutes; the session expires after thirty days.",
        ],
      },
      {
        heading: "Recipients and processors",
        paragraphs: [
          `Site hosting: ${legalEntity.host.name} (${legalEntity.host.address}), within the European Union.`,
          "Email delivery: Microsoft Ireland Operations Limited, through Microsoft 365, for contact-form messages and sign-in links.",
          "Editorial content management: Prismic, which hosts the site's published copy. No visitor data is sent to it.",
          "No personal data is sold, rented or otherwise passed on to third parties.",
        ],
      },
      {
        heading: "Cookies",
        paragraphs: [
          "This site sets no advertising cookies and uses no third-party analytics tracker. Typefaces are served from our own servers, so simply reading the site triggers no request to an external service.",
          "Two strictly necessary cookies may be set: “espace_session”, which keeps you signed in to the client area for thirty days, and “bigemotion_consent”, which remembers your cookie choices for twelve months. A strictly necessary cookie does not require prior consent.",
          "You can review and change your choices at any time through the “Cookie settings” button in the footer.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          "You have the right to access, correct, erase, object to, restrict the processing of, and port your data.",
          `To exercise them, write to ${contactEmail}. You will get an answer within one month.`,
          `If that answer does not satisfy you, you may lodge a complaint with the French data protection authority, the ${legalEntity.cnil.name}, ${legalEntity.cnil.address} (${legalEntity.cnil.url}).`,
        ],
      },
    ],
  },

  accessibilite: {
    title: "Accessibility statement",
    summary:
      "Where big-emotion.com stands on accessibility, what is already in place, and how to report a barrier.",
    sections: [
      {
        heading: "Our commitment",
        paragraphs: [
          "We build sites meant to be used by everyone, and we hold our own to the same standard. This statement describes the real state of accessibility on big-emotion.com, without overstating it.",
        ],
      },
      {
        heading: "Conformance status",
        paragraphs: [
          "This site has not been audited for accessibility by a third party. We therefore claim no conformance level against RGAA or WCAG: quoting a percentage without an audit would mean nothing.",
          "As a private company we are not subject to the conformance-declaration duty that applies to public bodies. This statement is voluntary.",
        ],
      },
      {
        heading: "What is in place",
        paragraphs: [
          "A skip link reaches the main content directly from the keyboard, and every page declares its language for screen readers.",
          "Animations and smooth scrolling are switched off when your system asks for reduced motion.",
          "Brand colours are paired so that text keeps its contrast against the surface behind it.",
        ],
      },
      {
        heading: "Known limitations",
        paragraphs: [
          "The home page is built on a scroll-linked three-dimensional scene. Its content is mirrored in accessible text, but the visual experience it delivers has no non-graphical equivalent.",
          "Some content is published by our clients or our editorial team: the quality of alternative text on the images they upload depends on what they write.",
        ],
      },
      {
        heading: "Reporting a problem",
        paragraphs: [
          `If you hit a barrier, write to ${contactEmail} with the page concerned and what went wrong. We will reply, and fix what can be fixed.`,
        ],
      },
    ],
  },
};

export const legalContent: Record<Locale, Record<LegalUid, LegalDocument>> = { fr, en };

/**
 * The little chrome around the text. It sits here rather than in `messages/*.json`
 * because it is page copy, not a UI affordance — and keeping it with the prose means one
 * module owns everything the legal routes render.
 */
export const legalChrome: Record<Locale, { updatedAt: string }> = {
  fr: { updatedAt: "Dernière mise à jour" },
  en: { updatedAt: "Last updated" },
};

/**
 * Where a legal page lives. The slug is the uid, so a document's route follows from its
 * identifier alone and the two cannot drift apart.
 *
 * The French slugs are kept on the English routes (`/en/mentions-legales/`): localizing
 * them needs next-intl's `pathnames` map, which would change how every existing route is
 * declared. Out of scope here, and a stable URL matters more on a legal page than a
 * translated one.
 */
export const legalHref = (uid: LegalUid): string => `/${uid}`;

/**
 * The footer's legal row, resolved on the server.
 *
 * Each label is the page's own title, so a link can never announce something different
 * from what it opens. Built here and passed down as props rather than imported by the
 * footer directly — the footer is a client component, and importing this module there
 * would ship every word of legal prose above to every visitor's browser.
 */
export type LegalNavLink = { uid: LegalUid; href: string; label: string };

export function legalNavLinks(locale: Locale): readonly LegalNavLink[] {
  return LEGAL_UIDS.map((uid) => ({
    uid,
    href: legalHref(uid),
    label: legalContent[locale][uid].title,
  }));
}
