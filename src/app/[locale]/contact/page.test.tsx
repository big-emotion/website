import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "../../../../messages/en.json";
import fr from "../../../../messages/fr.json";

// Vitest resolves next-intl to its browser build (see vitest.config.ts), where every
// server-only entry point is a throwing stub. `setRequestLocale` only tells Next.js to
// keep the route static — it has no bearing on what the page renders.
vi.mock("next-intl/server", () => ({ setRequestLocale: vi.fn() }));

const { default: ContactPage, generateMetadata } = await import("./page");

const metadataFor = (locale: string) => generateMetadata({ params: Promise.resolve({ locale }) });

describe("/contact", () => {
  it("serves the contact details and the form in the locale of the route", async () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        {await ContactPage({ params: Promise.resolve({ locale: "en" }) })}
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("link", { name: "hello@big-emotion.com" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
  });
});

describe("/contact metadata", () => {
  it("titles the page with the name it is navigated by", async () => {
    expect((await metadataFor("fr")).title).toBe("Contact");
  });

  it("describes the page with the invitation the page itself opens on", async () => {
    expect(await metadataFor("fr")).toHaveProperty(
      "description",
      expect.stringContaining("Une marque qui mérite"),
    );
  });

  it("declares the French route canonical and the English one its alternate", async () => {
    const { alternates } = await metadataFor("fr");

    expect(alternates?.canonical).toBe("/contact/");
    expect(alternates?.languages).toEqual({
      fr: "/contact/",
      en: "/en/contact/",
      "x-default": "/contact/",
    });
  });

  it("shares the localized route in the Open Graph card", async () => {
    const { openGraph } = await metadataFor("en");

    expect(openGraph?.url).toBe("https://big-emotion.com/en/contact/");
    expect(openGraph).toHaveProperty("locale", "en_US");
  });
});

describe("/contact hero", () => {
  it("crowns the page with the accent hero, which owns the only h1", async () => {
    const { container } = render(
      <NextIntlClientProvider locale="fr" messages={fr}>
        {await ContactPage({ params: Promise.resolve({ locale: "fr" }) })}
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName("Creons de la big emotion");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelector("section")).toHaveClass("bg-ink");
  });

  it("introduces the page with its lead and its decorative photo", async () => {
    const { container } = render(
      <NextIntlClientProvider locale="fr" messages={fr}>
        {await ContactPage({ params: Promise.resolve({ locale: "fr" }) })}
      </NextIntlClientProvider>,
    );

    expect(screen.getByText(new RegExp("Une marque qui mérite"))).toBeInTheDocument();
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("titles the hero in English on the English route", async () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        {await ContactPage({ params: Promise.resolve({ locale: "en" }) })}
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName("Let's make big emotion");
  });
});
