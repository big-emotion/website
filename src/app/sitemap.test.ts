import { describe, expect, it, vi } from "vitest";

const { getAllByType, articlesByLang } = vi.hoisted(() => ({
  getAllByType: vi.fn(),
  articlesByLang: { value: {} as Record<string, unknown[]> },
}));

vi.mock("@/prismicio", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/prismicio")>()),
  createClient: () => ({ getAllByType }),
}));

getAllByType.mockImplementation(async (_type: string, params: { lang: string }) =>
  articlesByLang.value[params.lang] ?? [],
);

const { default: sitemap } = await import("./sitemap");

function article(uid: string) {
  return { id: `id-${uid}`, uid, data: {} };
}

describe("sitemap", () => {
  it("lists the static routes in both locales, including the blog listing", async () => {
    articlesByLang.value = {};

    const entries = await sitemap();

    expect(entries.map((entry) => entry.url)).toEqual(
      expect.arrayContaining([
        "https://big-emotion.com/blog/",
        "https://big-emotion.com/en/blog/",
      ]),
    );
  });

  it("lists a blog article in both locales when it exists in both, with the counterpart alternate", async () => {
    articlesByLang.value = {
      "fr-fr": [article("notre-approche")],
      "en-us": [article("notre-approche")],
    };

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://big-emotion.com/blog/notre-approche/");
    expect(urls).toContain("https://big-emotion.com/en/blog/notre-approche/");

    const frEntry = entries.find((entry) => entry.url === "https://big-emotion.com/blog/notre-approche/");
    expect(frEntry?.alternates?.languages).toEqual({
      fr: "https://big-emotion.com/blog/notre-approche/",
      en: "https://big-emotion.com/en/blog/notre-approche/",
      "x-default": "https://big-emotion.com/blog/notre-approche/",
    });
  });

  it("lists a single-locale article once, without a counterpart alternate", async () => {
    articlesByLang.value = {
      "fr-fr": [article("brouillon-fr-seul")],
      "en-us": [],
    };

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://big-emotion.com/blog/brouillon-fr-seul/");
    expect(urls).not.toContain("https://big-emotion.com/en/blog/brouillon-fr-seul/");

    const entry = entries.find(
      (entry) => entry.url === "https://big-emotion.com/blog/brouillon-fr-seul/",
    );
    expect(entry?.alternates?.languages).toEqual({
      fr: "https://big-emotion.com/blog/brouillon-fr-seul/",
      "x-default": "https://big-emotion.com/blog/brouillon-fr-seul/",
    });
  });
});
