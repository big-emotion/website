import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { copy as poidsLourdCopy } from "@/components/playground/effects/poids-lourd/copy";
import { playgroundEffects } from "@/components/playground/effects";
import { ZoomControls } from "@/components/playground/zoom-controls";
import { legalChrome, legalContent } from "@/content/legal";
import { content } from "@/content/site";
import frMessages from "../../messages/fr.json";

// "Tutoiement assumé" is the first line of the charter's tone of voice (brand/BRAND.md
// §5), and the site spent a while half-obeying it: `messages/fr.json` said "Ton nom" and
// "on te repond" while `site.ts` said "Revenez bientôt" two files away. Nobody notices a
// register slipping in review, so it is checked here instead.
//
// English copy is never scanned — only the `fr` side of each bilingual source.

/** Unambiguous: no French word contains a bare "vous", "votre" or "vos". */
const VOUVOIEMENT_PRONOUN = /\b(vous|votre|vos)\b/i;

/** Second-person-plural verb endings, which is how vouvoiement sneaks in without a
 *  pronoun — "Revenez bientôt" reads polite with nothing to grep for. */
const VOUVOIEMENT_VERB = /\b[a-zà-ÿ]{2,}(?:ez|iez)\b/i;

/** Words that merely end in -ez without being verbs. Extend it when French does, but
 *  check first that the word really is not a conjugation. */
const NOT_A_VERB = new Set(["chez", "assez", "nez", "rez"]);

function frenchStringsIn(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(frenchStringsIn);
  if (value && typeof value === "object") return Object.values(value).flatMap(frenchStringsIn);
  return [];
}

function vouvoiementIn(sentence: string): string[] {
  const offenders: string[] = [];

  const pronoun = VOUVOIEMENT_PRONOUN.exec(sentence);
  if (pronoun) offenders.push(pronoun[0]);

  for (const word of sentence.split(/[^a-zà-ÿ]+/i)) {
    if (VOUVOIEMENT_VERB.test(word) && !NOT_A_VERB.has(word.toLowerCase())) offenders.push(word);
  }

  return offenders;
}

const FRENCH_COPY: Record<string, unknown> = {
  "content.fr": content.fr,
  "messages/fr.json": frMessages,
  // The legal pages are the easiest place for the register to slip: legal French is
  // vouvoiement by convention, so "Vous disposez d'un droit d'accès" writes itself. The
  // charter does not carve out an exception, and a site that says "Ton nom" on the
  // contact form and "vos données" one click away is the split this test exists to catch.
  "content/legal.ts fr": { pages: legalContent.fr, chrome: legalChrome.fr },
  "playgroundEffects[].fr": playgroundEffects.map((effect) => ({
    title: effect.title.fr,
    description: effect.description.fr,
  })),
  "poids-lourd copy.fr": poidsLourdCopy.fr,
};

function offendersAmong(sentences: readonly string[]) {
  return sentences
    .map((sentence) => ({ sentence, offenders: vouvoiementIn(sentence) }))
    .filter(({ offenders }) => offenders.length > 0);
}

describe("French copy speaks to one visitor, not to a committee", () => {
  it.each(Object.entries(FRENCH_COPY))("%s addresses the reader as tu", (_source, tree) => {
    expect(offendersAmong(frenchStringsIn(tree))).toEqual([]);
  });

  // ZoomControls keeps its copy module-private on purpose, so it is read the way a
  // visitor meets it — off the rendered control, labels included.
  it("the playground zoom control addresses the reader as tu", () => {
    render(<ZoomControls locale="fr" onZoom={() => {}} />);

    const onScreen = screen
      .getAllByRole("button")
      .map((button) => button.getAttribute("aria-label") ?? "");
    onScreen.push(document.body.textContent ?? "");

    expect(offendersAmong(onScreen)).toEqual([]);
  });
});
