import type { Content } from "@prismicio/client";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "../../../../../messages/en.json";
import fr from "../../../../../messages/fr.json";
import { content } from "@/content/site";

vi.mock("next-intl/server", () => ({ setRequestLocale: vi.fn() }));

const notFoundError = new Error("NEXT_NOT_FOUND");
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  notFound: () => {
    throw notFoundError;
  },
}));

const { getByUID, getByID, getAllByType, docsByLangUid, authorsById } = vi.hoisted(() => ({
  getByUID: vi.fn(),
  getByID: vi.fn(),
  getAllByType: vi.fn(),
  docsByLangUid: { value: {} as Record<string, unknown> },
  authorsById: { value: {} as Record<string, unknown> },
}));

vi.mock("@/prismicio", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/prismicio")>()),
  createClient: () => ({ getByUID, getByID, getAllByType }),
}));

getByUID.mockImplementation(async (_type: string, uid: string, opts: { lang: string }) => {
  const doc = docsByLangUid.value[`${opts.lang}:${uid}`];
  if (!doc) throw new Error("No documents were returned");
  return doc;
});

getByID.mockImplementation(async (id: string) => {
  const doc = authorsById.value[id];
  if (!doc) throw new Error("No documents were returned");
  return doc;
});

const {
  default: ArticlePage,
  generateStaticParams,
  generateMetadata,
} = await import("./page");

function article(
  uid: string,
  overrides: Partial<Record<string, unknown>> = {},
): Content.ArticleDocument {
  return {
    id: `id-${uid}`,
    uid,
    data: {
      title: "Notre approche",
      excerpt: [{ type: "paragraph", text: "Ce qu'on a appris.", spans: [] }],
      publish_date: "2026-01-10",
      cover: {},
      author: { link_type: "None" },
      body: [],
      ...overrides,
    },
  } as unknown as Content.ArticleDocument;
}

function author(id: string, name: string): Content.AuthorDocument {
  return {
    id,
    type: "author",
    data: { name, role: "Geek & philosophe", avatar: {} },
  } as unknown as Content.AuthorDocument;
}

const renderPage = (locale: string, uid: string) =>
  ArticlePage({ params: Promise.resolve({ locale, uid }) }).then((page) =>
    // The back link is the locale-aware `Link`, which reads the intl context.
    render(
      <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : fr}>
        {page}
      </NextIntlClientProvider>,
    ),
  );

describe("/blog/[uid]", () => {
  it("gives the article the page's only h1", async () => {
    docsByLangUid.value = { "fr-fr:notre-approche": article("notre-approche") };

    await renderPage("fr", "notre-approche");

    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName("Notre approche");
  });

  it("reads the article in the locale of the route", async () => {
    docsByLangUid.value = { "fr-fr:notre-approche": article("notre-approche") };

    await renderPage("fr", "notre-approche");

    expect(getByUID).toHaveBeenCalledWith("article", "notre-approche", { lang: "fr-fr" });
  });

  it("renders the body sections authored as slices", async () => {
    docsByLangUid.value = {
      "fr-fr:notre-approche": article("notre-approche", {
        body: [
          {
            id: "article_section$1",
            slice_type: "article_section",
            slice_label: null,
            variation: "default",
            version: "initial",
            primary: {
              heading: [{ type: "heading2", text: "Le contexte", spans: [] }],
              body: [{ type: "paragraph", text: "On a commence par ecouter.", spans: [] }],
              image: {},
            },
            items: [],
          },
        ],
      }),
    };

    await renderPage("fr", "notre-approche");

    expect(screen.getByRole("heading", { level: 2, name: "Le contexte" })).toBeInTheDocument();
    const bodyParagraph = screen.getByText("On a commence par ecouter.");
    expect(bodyParagraph).toBeInTheDocument();
    expect(bodyParagraph.closest(".article-prose")).toBeInTheDocument();
  });

  it("credits the author when the relationship is filled", async () => {
    docsByLangUid.value = {
      "fr-fr:notre-approche": article("notre-approche", {
        author: { link_type: "Document", id: "author-1", type: "author" },
      }),
    };
    authorsById.value = { "author-1": author("author-1", "Jean-Noe Kollo") };

    await renderPage("fr", "notre-approche");

    expect(screen.getByText(/Jean-Noe Kollo/)).toBeInTheDocument();
  });

  it("promotes the excerpt as a focal thesis pull-quote", async () => {
    docsByLangUid.value = { "fr-fr:notre-approche": article("notre-approche") };

    const { container } = await renderPage("fr", "notre-approche");

    const thesis = screen.getByText("Ce qu'on a appris.");
    expect(thesis.closest("blockquote")).toBeInTheDocument();
    expect(container.querySelectorAll("blockquote")).toHaveLength(1);
  });

  it("offers a way back to the index, in the locale of the route", async () => {
    docsByLangUid.value = { "en-us:notre-approche": article("notre-approche") };

    await renderPage("en", "notre-approche");

    expect(screen.getByRole("link", { name: content.en.blog.back })).toHaveAttribute(
      "href",
      "/en/blog",
    );
  });

  it("404s when the article has no document in this locale", async () => {
    docsByLangUid.value = {};

    await expect(renderPage("en", "notre-approche")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("pre-renders every published article in every locale", async () => {
    getAllByType.mockResolvedValue([article("notre-approche")]);

    const params = await generateStaticParams();

    expect(params).toEqual([
      { locale: "fr", uid: "notre-approche" },
      { locale: "en", uid: "notre-approche" },
    ]);
  });
});

describe("/blog/[uid] metadata", () => {
  it("titles the page with the article and describes it with its excerpt", async () => {
    docsByLangUid.value = { "fr-fr:notre-approche": article("notre-approche") };

    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "fr", uid: "notre-approche" }),
    });

    expect(metadata.title).toBe("Notre approche");
    expect(metadata.description).toContain("appris");
    expect(metadata.alternates?.canonical).toBe("/blog/notre-approche/");
  });

  it("declares both hreflang alternates when the article exists in both locales", async () => {
    docsByLangUid.value = {
      "fr-fr:notre-approche": article("notre-approche"),
      "en-us:notre-approche": article("notre-approche", { title: "Our approach" }),
    };

    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "fr", uid: "notre-approche" }),
    });

    expect(metadata.alternates?.languages).toEqual({
      fr: "/blog/notre-approche/",
      en: "/en/blog/notre-approche/",
      "x-default": "/blog/notre-approche/",
    });
  });

  it("omits the missing-language alternate when the article exists in one locale only", async () => {
    docsByLangUid.value = { "fr-fr:notre-approche": article("notre-approche") };

    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "fr", uid: "notre-approche" }),
    });

    expect(metadata.alternates?.languages).toEqual({
      fr: "/blog/notre-approche/",
      "x-default": "/blog/notre-approche/",
    });
  });
});
