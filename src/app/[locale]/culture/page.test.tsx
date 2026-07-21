import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "../../../../messages/en.json";

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
