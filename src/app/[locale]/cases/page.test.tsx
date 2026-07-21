import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Vitest resolves next-intl to its browser build (see vitest.config.ts), where every
// server-only entry point is a throwing stub. `setRequestLocale` only tells Next.js to
// keep the route static — it has no bearing on what the page renders.
vi.mock("next-intl/server", () => ({ setRequestLocale: vi.fn() }));

const { default: CasesPage, generateMetadata } = await import("./page");

const metadataFor = (locale: string) => generateMetadata({ params: Promise.resolve({ locale }) });

describe("/cases", () => {
  it("serves the cases section in the locale of the route", async () => {
    render(await CasesPage({ params: Promise.resolve({ locale: "en" }) }));

    expect(screen.getByRole("heading", { name: /media & publishing/i })).toBeInTheDocument();
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
