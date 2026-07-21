import type { Content } from "@prismicio/client";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({ setRequestLocale: vi.fn() }));

// `notFound()` throws in Next; the stub keeps that contract so the tests can assert the
// route bails instead of rendering a half-empty study.
const notFoundError = new Error("NEXT_NOT_FOUND");
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  notFound: () => {
    throw notFoundError;
  },
}));

const { getByUID, getAllByType } = vi.hoisted(() => ({
  getByUID: vi.fn(),
  getAllByType: vi.fn(),
}));

vi.mock("@/prismicio", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/prismicio")>()),
  createClient: () => ({ getByUID, getAllByType }),
}));

const { default: CaseStudyPage, generateStaticParams, generateMetadata } = await import("./page");

function caseStudy(overrides: Partial<Record<string, unknown>> = {}): Content.CaseStudyDocument {
  return {
    id: "id-industrie",
    uid: "industrie",
    data: {
      title: "Industrie & B2B",
      kind: "Plateformes de marque",
      client: "",
      summary: [
        { type: "paragraph", text: "Sortir un groupe industriel du site-plaquette.", spans: [] },
      ],
      tags: [],
      cover: {},
      body: [],
      ...overrides,
    },
  } as unknown as Content.CaseStudyDocument;
}

const renderPage = (locale: string, uid: string) =>
  CaseStudyPage({ params: Promise.resolve({ locale, uid }) }).then(render);

describe("/cases/[uid]", () => {
  it("gives the study the page's only h1", async () => {
    getByUID.mockResolvedValue(caseStudy());

    await renderPage("fr", "industrie");

    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName("Industrie & B2B");
  });

  it("reads the study in the locale of the route", async () => {
    getByUID.mockResolvedValue(caseStudy());

    await renderPage("fr", "industrie");

    expect(getByUID).toHaveBeenCalledWith("case_study", "industrie", { lang: "fr-fr" });
  });

  it("credits the nature of the mission when the client is under NDA", async () => {
    getByUID.mockResolvedValue(caseStudy());

    await renderPage("fr", "industrie");

    expect(screen.getByText("Plateformes de marque")).toBeInTheDocument();
  });

  it("renders the body chapters authored as slices", async () => {
    getByUID.mockResolvedValue(
      caseStudy({
        body: [
          {
            id: "case_chapter$1",
            slice_type: "case_chapter",
            slice_label: null,
            variation: "default",
            version: "initial",
            primary: {
              heading: [{ type: "heading2", text: "Le probleme", spans: [] }],
              body: [{ type: "paragraph", text: "Un site-plaquette.", spans: [] }],
              image: {},
            },
            items: [],
          },
        ],
      }),
    );

    await renderPage("fr", "industrie");

    expect(screen.getByRole("heading", { level: 2, name: "Le probleme" })).toBeInTheDocument();
    expect(screen.getByText("Un site-plaquette.")).toBeInTheDocument();
  });

  // An untranslated study must answer exactly like an unknown path, so the 404 cannot be
  // read as "this exists, just not for you".
  it("404s when the study has no document in this locale", async () => {
    getByUID.mockRejectedValue(new Error("No documents were returned"));

    await expect(renderPage("en", "industrie")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("pre-renders every published study in every locale", async () => {
    getAllByType.mockResolvedValue([caseStudy()]);

    const params = await generateStaticParams();

    expect(params).toEqual([
      { locale: "fr", uid: "industrie" },
      { locale: "en", uid: "industrie" },
    ]);
  });
});

describe("/cases/[uid] metadata", () => {
  it("titles the page with the study and describes it with its summary", async () => {
    getByUID.mockResolvedValue(caseStudy());

    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "fr", uid: "industrie" }),
    });

    expect(metadata.title).toBe("Industrie & B2B");
    expect(metadata.description).toContain("site-plaquette");
    expect(metadata.alternates?.canonical).toBe("/cases/industrie/");
  });
});
