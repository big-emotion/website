import type { Content } from "@prismicio/client";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import enMessages from "../../../../messages/en.json";
import frMessages from "../../../../messages/fr.json";

vi.mock("next-intl/server", () => ({ setRequestLocale: vi.fn() }));

vi.mock("next/link", () => ({
  default: ({ children, ...rest }: React.ComponentProps<"a">) => <a {...rest}>{children}</a>,
}));

const { getAllByType, articlesByLang } = vi.hoisted(() => ({
  getAllByType: vi.fn(),
  articlesByLang: { value: {} as Record<string, unknown[]> },
}));

vi.mock("@/prismicio", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/prismicio")>()),
  createClient: () => ({ getAllByType }),
}));

getAllByType.mockImplementation(
  async (_type: string, params: { lang: string }) => articlesByLang.value[params.lang] ?? [],
);

const { default: BlogPage, generateMetadata } = await import("./page");

const messages = { fr: frMessages, en: enMessages };

function article(uid: string, title: string, publishDate: string): Content.ArticleDocument {
  return {
    id: `id-${uid}`,
    uid,
    data: {
      title,
      excerpt: [{ type: "paragraph", text: `Extrait de ${title}`, spans: [] }],
      publish_date: publishDate,
      cover: {},
      author: { link_type: "Document" },
      body: [],
    },
  } as unknown as Content.ArticleDocument;
}

const metadataFor = (locale: string) => generateMetadata({ params: Promise.resolve({ locale }) });

async function renderPage(locale: "fr" | "en") {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      {await BlogPage({ params: Promise.resolve({ locale }) })}
    </NextIntlClientProvider>,
  );
}

describe("/blog", () => {
  it("reads articles from Prismic in the locale of the route", async () => {
    articlesByLang.value = {
      "en-us": [article("our-approach", "Our approach", "2026-01-10")],
    };

    await renderPage("en");

    expect(screen.getByRole("heading", { name: /our approach/i, level: 2 })).toBeInTheDocument();
    expect(getAllByType).toHaveBeenCalledWith(
      "article",
      expect.objectContaining({ lang: "en-us" }),
    );
  });

  it("asks Prismic for French content on the French route", async () => {
    articlesByLang.value = {
      "fr-fr": [article("notre-approche", "Notre approche", "2026-01-10")],
    };

    await renderPage("fr");

    expect(screen.getByRole("heading", { name: /notre approche/i, level: 2 })).toBeInTheDocument();
  });

  it("orders articles by publish date, most recent first", async () => {
    articlesByLang.value = {};

    await renderPage("fr");

    expect(getAllByType).toHaveBeenCalledWith(
      "article",
      expect.objectContaining({
        orderings: [{ field: "my.article.publish_date", direction: "desc" }],
      }),
    );
  });

  it("promotes the newest article to a featured block and demotes the rest to a level-3 list", async () => {
    articlesByLang.value = {
      "fr-fr": [
        article("ferry", "Ferry", "2026-07-21"),
        article("standard", "Project Standard", "2026-07-20"),
        article("jugement", "Le jugement", "2026-06-10"),
      ],
    };

    await renderPage("fr");

    // Newest → the single featured block, and never repeated as a list row.
    expect(screen.getByRole("heading", { name: "Ferry", level: 2 })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Ferry", level: 3 })).not.toBeInTheDocument();
    // The rest → the demoted index.
    expect(screen.getByRole("heading", { name: "Project Standard", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Le jugement", level: 3 })).toBeInTheDocument();
  });

  it("keeps the excerpt on the featured post but drops it from the demoted list", async () => {
    articlesByLang.value = {
      "fr-fr": [
        article("ferry", "Ferry", "2026-07-21"),
        article("standard", "Project Standard", "2026-07-20"),
      ],
    };

    await renderPage("fr");

    expect(screen.getByText("Extrait de Ferry")).toBeInTheDocument();
    expect(screen.queryByText("Extrait de Project Standard")).not.toBeInTheDocument();
  });

  it("counts the published articles in the hero", async () => {
    articlesByLang.value = {
      "fr-fr": [
        article("ferry", "Ferry", "2026-07-21"),
        article("standard", "Project Standard", "2026-07-20"),
        article("jugement", "Le jugement", "2026-06-10"),
      ],
    };

    await renderPage("fr");

    expect(screen.getByText("3 articles")).toBeInTheDocument();
  });

  it("links each card to its detail page via the locale-aware Link", async () => {
    articlesByLang.value = {
      "fr-fr": [article("notre-approche", "Notre approche", "2026-01-10")],
    };

    await renderPage("fr");

    expect(screen.getByRole("link", { name: /notre approche/i })).toHaveAttribute(
      "href",
      "/blog/notre-approche",
    );
  });

  it("renders a clean empty state when the locale has no articles", async () => {
    articlesByLang.value = { "fr-fr": [] };

    await renderPage("fr");

    expect(screen.getByText("Aucun article pour le moment. Reviens bientôt.")).toBeInTheDocument();
  });

  it("does not leak one locale's articles into the other", async () => {
    articlesByLang.value = {
      "fr-fr": [article("notre-approche", "Notre approche", "2026-01-10")],
      "en-us": [],
    };

    await renderPage("en");

    expect(screen.queryByText("Notre approche")).not.toBeInTheDocument();
  });
});

describe("/blog metadata", () => {
  it("titles the page with the nav entry it is navigated by", async () => {
    expect((await metadataFor("fr")).title).toBe("Blog");
    expect((await metadataFor("en")).title).toBe("Blog");
  });

  it("declares the French route canonical and the English one its alternate", async () => {
    const { alternates } = await metadataFor("fr");

    expect(alternates?.canonical).toBe("/blog/");
    expect(alternates?.languages).toEqual({
      fr: "/blog/",
      en: "/en/blog/",
      "x-default": "/blog/",
    });
  });
});
