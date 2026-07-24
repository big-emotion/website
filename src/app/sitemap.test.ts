import { describe, expect, it, vi } from "vitest";
import type { PlaygroundEffect } from "@/components/playground/effects";

const { getAllByType, articlesByLang, effects } = vi.hoisted(() => ({
  getAllByType: vi.fn(),
  articlesByLang: { value: {} as Record<string, unknown[]> },
  effects: { value: [] as PlaygroundEffect[] },
}));

vi.mock("@/prismicio", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/prismicio")>()),
  createClient: () => ({ getAllByType }),
}));

vi.mock("@/components/playground/effects", () => ({
  get playgroundEffects() {
    return effects.value;
  },
}));

getAllByType.mockImplementation(
  async (_type: string, params: { lang: string }) => articlesByLang.value[params.lang] ?? [],
);

const { default: sitemap } = await import("./sitemap");

function effect(slug: string): PlaygroundEffect {
  return {
    id: slug,
    slug,
    title: { fr: slug, en: slug },
    description: { fr: slug, en: slug },
    preview: "orient",
    component: null as unknown as PlaygroundEffect["component"],
  };
}

function article(uid: string) {
  return { id: `id-${uid}`, uid, data: {} };
}

describe("sitemap", () => {
  it("lists the static routes in both locales, including the blog listing", async () => {
    articlesByLang.value = {};
    effects.value = [];

    const entries = await sitemap();

    expect(entries.map((entry) => entry.url)).toEqual(
      expect.arrayContaining(["https://big-emotion.com/blog/", "https://big-emotion.com/en/blog/"]),
    );
  });

  it("lists a blog article in both locales when it exists in both, with the counterpart alternate", async () => {
    articlesByLang.value = {
      "fr-fr": [article("notre-approche")],
      "en-us": [article("notre-approche")],
    };
    effects.value = [];

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://big-emotion.com/blog/notre-approche/");
    expect(urls).toContain("https://big-emotion.com/en/blog/notre-approche/");

    const frEntry = entries.find(
      (entry) => entry.url === "https://big-emotion.com/blog/notre-approche/",
    );
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
    effects.value = [];

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

  it("lists no per-effect URLs while the registry ships empty — only the gallery itself", async () => {
    articlesByLang.value = {};
    effects.value = [];

    const entries = await sitemap();
    const playgroundUrls = entries
      .map((entry) => entry.url)
      .filter((url) => url.includes("/playground/"));

    expect(playgroundUrls).toEqual([
      "https://big-emotion.com/playground/",
      "https://big-emotion.com/en/playground/",
    ]);
  });

  it("lists a registered effect in both locales, with the counterpart alternate", async () => {
    articlesByLang.value = {};
    effects.value = [effect("mock-ripple")];

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://big-emotion.com/playground/mock-ripple/");
    expect(urls).toContain("https://big-emotion.com/en/playground/mock-ripple/");

    const frEntry = entries.find(
      (entry) => entry.url === "https://big-emotion.com/playground/mock-ripple/",
    );
    expect(frEntry?.alternates?.languages).toEqual({
      fr: "https://big-emotion.com/playground/mock-ripple/",
      en: "https://big-emotion.com/en/playground/mock-ripple/",
      "x-default": "https://big-emotion.com/playground/mock-ripple/",
    });
  });
});
