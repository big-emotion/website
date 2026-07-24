import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { getByUID, documents } = vi.hoisted(() => ({
  getByUID: vi.fn(),
  documents: { value: {} as Record<string, unknown> },
}));

vi.mock("@/prismicio", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/prismicio")>()),
  createClient: () => ({ getByUID }),
}));

// Prismic's client rejects on a uid with no document in the requested locale, which is
// exactly the "nothing published yet" case these pages have to survive.
getByUID.mockImplementation(async (_type: string, uid: string, params: { lang: string }) => {
  const document = documents.value[`${uid}:${params.lang}`];
  if (!document) throw new Error("not found");
  return document;
});

const { LegalPage } = await import("./legal-page");

function publishedDocument(title: string, bodyText: string) {
  return {
    uid: "mentions-legales",
    data: {
      title,
      updated_at: "2026-03-01",
      body: [{ type: "paragraph", text: bodyText, spans: [] }],
      meta_title: null,
      meta_description: null,
    },
  };
}

const renderPage = async (props: Parameters<typeof LegalPage>[0]) =>
  render(await LegalPage(props));

describe("LegalPage", () => {
  it("renders the wording an editor published in Prismic", async () => {
    documents.value = {
      "mentions-legales:fr-fr": publishedDocument(
        "Mentions legales revisitees",
        "Une version relue par le conseil juridique de l'agence, suffisamment longue pour compter.",
      ),
    };

    await renderPage({ locale: "fr", uid: "mentions-legales" });

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Mentions legales revisitees",
    );
    expect(screen.getByText(/relue par le conseil juridique/)).toBeInTheDocument();
  });

  it("asks Prismic for content in the locale of the route", async () => {
    documents.value = {};

    await renderPage({ locale: "en", uid: "mentions-legales" });

    expect(getByUID).toHaveBeenCalledWith(
      "legal_page",
      "mentions-legales",
      expect.objectContaining({ lang: "en-us" }),
    );
  });

  // The obligation does not pause while the CMS is empty, so this is the case that
  // matters most: an unpublished document must still produce a lawful page.
  it("publishes the mandatory identification when Prismic holds no document", async () => {
    documents.value = {};

    await renderPage({ locale: "fr", uid: "mentions-legales" });

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Mentions légales");
    expect(screen.getByText(/983 423 351 R\.C\.S\. Paris/)).toBeInTheDocument();
    expect(screen.getByText(/OVH SAS/)).toBeInTheDocument();
    expect(screen.getByText(/Jean-Noé Kollo/)).toBeInTheDocument();
  });

  it("falls back when an editor empties the body but leaves the document in place", async () => {
    documents.value = {
      "mentions-legales:fr-fr": publishedDocument("Mentions legales", "A completer"),
    };

    await renderPage({ locale: "fr", uid: "mentions-legales" });

    expect(screen.getByText(/983 423 351 R\.C\.S\. Paris/)).toBeInTheDocument();
    expect(screen.queryByText("A completer")).not.toBeInTheDocument();
  });

  it("names the data controller and the CNIL on the privacy policy", async () => {
    documents.value = {};

    await renderPage({ locale: "fr", uid: "politique-de-confidentialite" });

    // The address appears under both "Responsable du traitement" and "Vos droits" —
    // a reader must not have to scroll back up to find where to write.
    expect(screen.getAllByText(/hello@big-emotion\.com/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Commission nationale de l'informatique/)).toBeInTheDocument();
  });

  // Claiming a conformance level we have not measured would be the one thing an
  // accessibility statement must never do.
  it("claims no conformance level on the accessibility statement", async () => {
    documents.value = {};

    await renderPage({ locale: "fr", uid: "accessibilite" });

    expect(screen.getByText(/n'a pas fait l'objet d'un audit/)).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("serves the mandatory copy in English on the English route", async () => {
    documents.value = {};

    await renderPage({ locale: "en", uid: "accessibilite" });

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Accessibility statement");
  });
});
