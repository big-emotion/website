import type { Content } from "@prismicio/client";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import enMessages from "../../../../messages/en.json";
import frMessages from "../../../../messages/fr.json";

// Vitest resolves next-intl to its browser build (see vitest.config.ts), where every
// server-only entry point is a throwing stub. `setRequestLocale` only tells Next.js to
// keep the route static — it has no bearing on what the page renders.
vi.mock("next-intl/server", () => ({ setRequestLocale: vi.fn() }));

vi.mock("next/link", () => ({
  default: ({ children, ...rest }: React.ComponentProps<"a">) => <a {...rest}>{children}</a>,
}));

// The route is the seam that talks to Prismic, so the client is stubbed and the query it
// issues is asserted directly. `caseStudiesByLang` is what the fake repository holds.
const { getAllByType, caseStudiesByLang } = vi.hoisted(() => ({
  getAllByType: vi.fn(),
  caseStudiesByLang: { value: {} as Record<string, unknown[]> },
}));

vi.mock("@/prismicio", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/prismicio")>()),
  createClient: () => ({ getAllByType }),
}));

getAllByType.mockImplementation(async (_type: string, params: { lang: string }) =>
  caseStudiesByLang.value[params.lang] ?? [],
);

const { default: CasesPage, generateMetadata } = await import("./page");

const messages = { fr: frMessages, en: enMessages };

function caseStudy(uid: string, title: string, kind: string): Content.CaseStudyDocument {
  return {
    id: `id-${uid}`,
    uid,
    data: {
      title,
      kind,
      client: "",
      summary: [{ type: "paragraph", text: "", spans: [] }],
      tags: [],
      cover: {},
      body: [],
    },
  } as unknown as Content.CaseStudyDocument;
}

const metadataFor = (locale: string) => generateMetadata({ params: Promise.resolve({ locale }) });

async function renderPage(locale: "fr" | "en") {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      {await CasesPage({ params: Promise.resolve({ locale }) })}
    </NextIntlClientProvider>,
  );
}

describe("/cases", () => {
  it("reads the case studies from Prismic in the locale of the route", async () => {
    caseStudiesByLang.value = {
      "en-us": [caseStudy("medias", "Media & Publishing", "Audience & monetisation")],
    };

    await renderPage("en");

    expect(screen.getByRole("heading", { name: /media & publishing/i })).toBeInTheDocument();
    expect(getAllByType).toHaveBeenCalledWith(
      "case_study",
      expect.objectContaining({ lang: "en-us" }),
    );
  });

  it("asks Prismic for French content on the French route", async () => {
    caseStudiesByLang.value = {
      "fr-fr": [caseStudy("medias", "Medias & Edition", "Audience & monetisation")],
    };

    await renderPage("fr");

    expect(screen.getByRole("heading", { name: /medias & edition/i })).toBeInTheDocument();
  });

  // The studies were published in a single release, so publication timestamps tie and
  // would leave the running order to the API — and liable to differ between builds.
  it("runs the studies in their editorial order rather than by publication date", async () => {
    caseStudiesByLang.value = {};

    await renderPage("fr");

    expect(getAllByType).toHaveBeenCalledWith(
      "case_study",
      expect.objectContaining({
        orderings: [{ field: "my.case_study.display_order", direction: "asc" }],
      }),
    );
  });
});

describe("/cases metadata", () => {
  it("titles the page with the name it is navigated by", async () => {
    expect((await metadataFor("fr")).title).toBe("References & Impact");
    expect((await metadataFor("en")).title).toBe("Cases & Impact");
  });

  it("declares the French route canonical and the English one its alternate", async () => {
    const { alternates } = await metadataFor("fr");

    expect(alternates?.canonical).toBe("/cases/");
    expect(alternates?.languages).toEqual({
      fr: "/cases/",
      en: "/en/cases/",
      "x-default": "/cases/",
    });
  });

  it("shares the localized route in the Open Graph card", async () => {
    const { openGraph } = await metadataFor("en");

    expect(openGraph?.url).toBe("https://big-emotion.com/en/cases/");
    expect(openGraph).toHaveProperty("locale", "en_US");
  });
});

describe("/cases hero", () => {
  it("crowns the page with the accent hero, which owns the only h1", async () => {
    caseStudiesByLang.value = {};

    const { container } = await renderPage("fr");

    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName(
      "Derriere chaque clic, une emotion",
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelector("section")).toHaveClass("bg-tangerine");
  });

  it("introduces the page with its lead and its decorative photo", async () => {
    caseStudiesByLang.value = {};

    const { container } = await renderPage("fr");

    expect(screen.getByText(new RegExp("Une sélection de projets"))).toBeInTheDocument();
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("titles the hero in English on the English route", async () => {
    caseStudiesByLang.value = {};

    await renderPage("en");

    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName(
      "Behind every click, a feeling",
    );
  });
});
