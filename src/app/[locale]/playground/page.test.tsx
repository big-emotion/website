import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "../../../../messages/en.json";
import fr from "../../../../messages/fr.json";

vi.mock("next-intl/server", () => ({ setRequestLocale: vi.fn() }));

const { default: PlaygroundPage, generateMetadata } = await import("./page");

const metadataFor = (locale: string) => generateMetadata({ params: Promise.resolve({ locale }) });

describe("/playground", () => {
  it("titles the page with its nav entry, in the locale of the route", async () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        {await PlaygroundPage({ params: Promise.resolve({ locale: "en" }) })}
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Playground" })).toBeInTheDocument();
  });

  it("shows the lead, and a card per registered effect now the registry is no longer empty", async () => {
    render(
      <NextIntlClientProvider locale="fr" messages={fr}>
        {await PlaygroundPage({ params: Promise.resolve({ locale: "fr" }) })}
      </NextIntlClientProvider>,
    );

    expect(screen.getByText(/espace vivant/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "lumiere" })).toBeInTheDocument();
    expect(screen.queryByText("Aucune expérience pour le moment. Revenez bientôt.")).not.toBeInTheDocument();
  });
});

describe("/playground metadata", () => {
  it("titles the page with the nav entry it is navigated by", async () => {
    expect((await metadataFor("fr")).title).toBe("Playground");
    expect((await metadataFor("en")).title).toBe("Playground");
  });

  it("declares the French route canonical and the English one its alternate", async () => {
    const { alternates } = await metadataFor("fr");

    expect(alternates?.canonical).toBe("/playground/");
    expect(alternates?.languages).toEqual({
      fr: "/playground/",
      en: "/en/playground/",
      "x-default": "/playground/",
    });
  });
});
