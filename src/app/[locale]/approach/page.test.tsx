import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Vitest resolves next-intl to its browser build (see vitest.config.ts), where every
// server-only entry point is a throwing stub. `setRequestLocale` only tells Next.js to
// keep the route static — it has no bearing on what the page renders.
vi.mock("next-intl/server", () => ({ setRequestLocale: vi.fn() }));

const { default: ApproachPage, generateMetadata } = await import("./page");

const metadataFor = (locale: string) => generateMetadata({ params: Promise.resolve({ locale }) });

describe("/approach", () => {
  it("serves the approach section in the locale of the route", async () => {
    render(await ApproachPage({ params: Promise.resolve({ locale: "en" }) }));

    expect(
      screen.getByRole("heading", { name: /We build custom, we advise straight/ }),
    ).toBeInTheDocument();
  });
});

describe("/approach metadata", () => {
  it("titles the page with the name it is navigated by", async () => {
    expect((await metadataFor("fr")).title).toBe("Approche");
    expect((await metadataFor("en")).title).toBe("Approach");
  });

  it("describes the page with its own lead paragraph", async () => {
    expect(await metadataFor("fr")).toHaveProperty(
      "description",
      expect.stringContaining("On part de la réaction"),
    );
  });

  it("declares the French route canonical and the English one its alternate", async () => {
    const { alternates } = await metadataFor("fr");

    expect(alternates?.canonical).toBe("/approach/");
    expect(alternates?.languages).toEqual({
      fr: "/approach/",
      en: "/en/approach/",
      "x-default": "/approach/",
    });
  });

  it("shares the localized route in the Open Graph card", async () => {
    const { openGraph } = await metadataFor("en");

    expect(openGraph?.url).toBe("https://big-emotion.com/en/approach/");
    expect(openGraph).toHaveProperty("locale", "en_US");
    expect(openGraph).toHaveProperty("alternateLocale", ["fr_FR"]);
  });
});

describe("/approach hero", () => {
  it("crowns the page with the accent hero, which owns the only h1", async () => {
    const { container } = render(await ApproachPage({ params: Promise.resolve({ locale: "fr" }) }));

    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName(
      "L'agence qui fait dire wow",
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelector("section")).toHaveClass("bg-lemon");
  });

  it("introduces the page with its lead and its decorative photo", async () => {
    const { container } = render(await ApproachPage({ params: Promise.resolve({ locale: "fr" }) }));

    expect(screen.getByText(new RegExp("On part de la réaction"))).toBeInTheDocument();
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("titles the hero in English on the English route", async () => {
    render(await ApproachPage({ params: Promise.resolve({ locale: "en" }) }));

    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName(
      "The agency that gives a wow",
    );
  });
});
