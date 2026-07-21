import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "../../../../messages/en.json";
import fr from "../../../../messages/fr.json";

// Vitest resolves next-intl to its browser build (see vitest.config.ts), where every
// server-only entry point is a throwing stub. `setRequestLocale` only tells Next.js to
// keep the route static — it has no bearing on what the page renders.
vi.mock("next-intl/server", () => ({ setRequestLocale: vi.fn() }));

const { default: CulturePage, generateMetadata } = await import("./page");

const metadataFor = (locale: string) => generateMetadata({ params: Promise.resolve({ locale }) });

describe("/culture", () => {
  it("serves the culture section in the locale of the route", async () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        {await CulturePage({ params: Promise.resolve({ locale: "en" }) })}
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("Geek & philosopher")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "They trusted us" })).toBeInTheDocument();
  });
});

describe("/culture metadata", () => {
  it("titles the page with the name it is navigated by", async () => {
    expect((await metadataFor("fr")).title).toBe("Culture");
  });

  it("describes the page with its own lead paragraph", async () => {
    expect(await metadataFor("en")).toHaveProperty(
      "description",
      expect.stringContaining("Born on the web"),
    );
  });

  it("declares the French route canonical and the English one its alternate", async () => {
    const { alternates } = await metadataFor("fr");

    expect(alternates?.canonical).toBe("/culture/");
    expect(alternates?.languages).toEqual({
      fr: "/culture/",
      en: "/en/culture/",
      "x-default": "/culture/",
    });
  });

  it("shares the localized route in the Open Graph card", async () => {
    const { openGraph } = await metadataFor("en");

    expect(openGraph?.url).toBe("https://big-emotion.com/en/culture/");
    expect(openGraph).toHaveProperty("locale", "en_US");
  });
});

describe("/culture hero", () => {
  it("crowns the page with the accent hero, which owns the only h1", async () => {
    const { container } = render(
      <NextIntlClientProvider locale="fr" messages={fr}>
        {await CulturePage({ params: Promise.resolve({ locale: "fr" }) })}
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName("Digital first, emotion toujours");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelector("section")).toHaveClass("bg-lyon");
  });

  it("introduces the page with its lead and its decorative photo", async () => {
    const { container } = render(
      <NextIntlClientProvider locale="fr" messages={fr}>
        {await CulturePage({ params: Promise.resolve({ locale: "fr" }) })}
      </NextIntlClientProvider>,
    );

    expect(screen.getByText(new RegExp("Nés sur le web"))).toBeInTheDocument();
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("titles the hero in English on the English route", async () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        {await CulturePage({ params: Promise.resolve({ locale: "en" }) })}
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName("Digital first emotion, always");
  });
});
