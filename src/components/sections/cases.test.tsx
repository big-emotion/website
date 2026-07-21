import type { Content } from "@prismicio/client";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import type { Locale } from "@/i18n/locales";
import enMessages from "../../../messages/en.json";
import frMessages from "../../../messages/fr.json";

// `next/link` rewrites hrefs to match `trailingSlash` from next.config.ts, which a unit
// test never loads. A passthrough anchor keeps these assertions on the destination the
// section picked, not on Next's URL normalisation.
vi.mock("next/link", () => ({
  default: ({ children, ...rest }: React.ComponentProps<"a">) => <a {...rest}>{children}</a>,
}));

import { Cases } from "./cases";

const messages = { fr: frMessages, en: enMessages };

/**
 * A published case study as the route hands it over. Only the fields the section
 * actually reads are populated — the rest of the Prismic document shape is noise here.
 */
function caseStudy(fields: {
  uid: string;
  title: string;
  kind: string;
  client?: string;
  summary?: string;
  tags?: string[];
}): Content.CaseStudyDocument {
  return {
    id: `id-${fields.uid}`,
    uid: fields.uid,
    data: {
      title: fields.title,
      kind: fields.kind,
      client: fields.client ?? "",
      summary: [{ type: "paragraph", text: fields.summary ?? "", spans: [] }],
      tags: (fields.tags ?? []).map((label) => ({ label })),
      cover: {},
      body: [],
    },
  } as unknown as Content.CaseStudyDocument;
}

const SECTORS = [
  caseStudy({
    uid: "industrie",
    title: "Industrie & B2B",
    kind: "Plateformes de marque",
    summary: "Sortir un groupe industriel du site-plaquette.",
    tags: ["Refonte", "SEO"],
  }),
  caseStudy({ uid: "medias", title: "Medias & Edition", kind: "Audience & monetisation" }),
];

function renderCases(locale: Locale = "fr", caseStudies = SECTORS) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      <Cases locale={locale} caseStudies={caseStudies} />
    </NextIntlClientProvider>,
  );
}

describe("Cases", () => {
  // The page title and lead live in the accent hero above the section (SWBE-22).
  it("leaves the page title to the hero", () => {
    renderCases();

    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("presents the case studies published in Prismic", () => {
    renderCases();

    expect(screen.getByRole("heading", { name: /industrie & b2b/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /medias & edition/i })).toBeInTheDocument();
  });

  it("opens each case study on its own page", () => {
    renderCases();

    expect(screen.getByRole("link", { name: /industrie & b2b/i })).toHaveAttribute(
      "href",
      "/cases/industrie",
    );
  });

  it("renders the summary as text and the tags as a list", () => {
    renderCases();

    expect(screen.getByText(/site-plaquette/)).toBeInTheDocument();
    expect(screen.getByText("Refonte")).toBeInTheDocument();
  });

  // Most engagements ship under NDA: the sector is what the card can credit.
  it("credits the nature of the mission when the client cannot be named", () => {
    renderCases();

    expect(screen.getByText("Plateformes de marque")).toBeInTheDocument();
  });

  it("credits the client by name when the engagement allows it", () => {
    renderCases("fr", [
      caseStudy({
        uid: "mamiezi",
        title: "MAMIEZI",
        kind: "Plateformes de marque",
        client: "MAMIEZI SA",
      }),
    ]);

    expect(screen.getByText("MAMIEZI SA")).toBeInTheDocument();
    expect(screen.queryByText("Plateformes de marque")).toBeNull();
  });

  it("names the agency's own productions and links them out", () => {
    renderCases();

    expect(screen.getByRole("heading", { name: /ethniafrica/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ethniafrica sur le web/i })).toHaveAttribute(
      "href",
      "https://ethniafrica.com/fr",
    );
  });

  it("links the project standard plugin to its repository", () => {
    renderCases();

    expect(screen.getByRole("heading", { name: /project standard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Project Standard sur GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/big-emotion/project-standard",
    );
  });

  it("keeps Ferry's two distribution links distinguishable out of context", () => {
    renderCases();

    expect(screen.getByRole("link", { name: "Ferry sur GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/big-emotion/ferry",
    );
    expect(screen.getByRole("link", { name: "Ferry sur npm" })).toHaveAttribute(
      "href",
      "https://www.npmjs.com/package/@big-emotion/ferry",
    );
  });

  it("answers in English on the English route, link labels included", () => {
    renderCases("en");

    expect(screen.getByRole("heading", { name: "Our own productions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ferry on GitHub" })).toBeInTheDocument();
  });

  it("keeps the impact figures readable as a definition list", () => {
    const { container } = renderCases();

    expect(container.querySelectorAll("dl dt")).toHaveLength(2);
    expect(container.querySelectorAll("dl dd")).toHaveLength(2);
  });

  // The roster belongs to the references page, not to /culture where it first shipped:
  // it corroborates the work above rather than sitting among the team and the brand
  // personality.
  it("closes on the client roster", () => {
    renderCases();

    expect(
      screen.getByRole("heading", { name: "Ils nous ont fait confiance" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Radio France").length).toBeGreaterThan(0);
  });
});
