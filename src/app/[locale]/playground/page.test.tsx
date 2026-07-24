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

  it("shows the lead and a card per registered effect", async () => {
    render(
      <NextIntlClientProvider locale="fr" messages={fr}>
        {await PlaygroundPage({ params: Promise.resolve({ locale: "fr" }) })}
      </NextIntlClientProvider>,
    );

    expect(screen.getByText(/espace vivant/)).toBeInTheDocument();
    // Cards are named after the effect, not its URL segment — the slug was never copy.
    expect(screen.getByRole("link", { name: "LUMIERE" })).toHaveAttribute(
      "href",
      "/playground/lumiere",
    );
    expect(screen.getByRole("link", { name: "Poids Lourd" })).toHaveAttribute(
      "href",
      "/playground/poids-lourd",
    );
    expect(screen.getByRole("link", { name: "BIG BANG" })).toHaveAttribute(
      "href",
      "/playground/big-bang",
    );
    expect(screen.getByText(/murs élastiques/)).toBeInTheDocument();
    expect(
      screen.queryByText("Aucune expérience pour le moment. Revenez bientôt."),
    ).not.toBeInTheDocument();
  });

  // The gallery is a section route like /culture or /cases, so it takes the same hero
  // band — a photo beside the stacked title, not the hand-rolled h1 it shipped with.
  it("opens on the shared subpage hero, photo included", async () => {
    render(
      <NextIntlClientProvider locale="fr" messages={fr}>
        {await PlaygroundPage({ params: Promise.resolve({ locale: "fr" }) })}
      </NextIntlClientProvider>,
    );

    expect(screen.getByTestId("subpage-photo-frame")).toBeInTheDocument();
    expect(screen.queryByTestId("subpage-photo-placeholder")).not.toBeInTheDocument();
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
