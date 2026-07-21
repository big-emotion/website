import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";
import { Culture } from "./culture";

const messages = { fr, en };

function renderCulture(locale: "fr" | "en") {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      <Culture locale={locale} />
    </NextIntlClientProvider>,
  );
}

describe("Culture", () => {
  // The page title and lead live in the accent hero above the section (SWBE-22).
  it("leaves the page title to the hero", () => {
    renderCulture("fr");

    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("links Sylvain's own site under his name", () => {
    renderCulture("fr");
    const site = screen.getByRole("link", { name: /sylvain seng bandith sur son site/i });
    expect(site).toHaveAttribute("href", "https://www.sylvainsengbandith.fr/");
  });

  it("disambiguates the two LinkedIn links, which share the same visible label", () => {
    renderCulture("fr");
    expect(screen.getByRole("link", { name: "Jean-Noe Kollo sur LinkedIn" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/jnkollo/",
    );
    expect(
      screen.getByRole("link", { name: "Sylvain Seng Bandith sur LinkedIn" }),
    ).toHaveAttribute("href", "https://fr.linkedin.com/in/sylvain-sengbandith-83515b28");
  });

  it("opens every founder profile in a new tab without leaking the opener", () => {
    renderCulture("fr");
    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    }
  });

  it("answers in English on the English route, founder roles and values included", () => {
    renderCulture("en");

    expect(screen.getByText("Geek & philosopher")).toBeInTheDocument();
    expect(screen.getByText(/Boldness/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Jean-Noe Kollo on LinkedIn" })).toBeInTheDocument();
  });
});
