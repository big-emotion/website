import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";
import { Contact } from "./contact";

const messages = { fr, en };

function renderContact(locale: "fr" | "en") {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      <Contact locale={locale} />
    </NextIntlClientProvider>,
  );
}

describe("Contact", () => {
  // The headline and lead live in the accent hero above the section (SWBE-22).
  it("leaves the page title to the hero", () => {
    renderContact("fr");

    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("offers the public inbox and phone number as actionable links", () => {
    renderContact("fr");

    expect(screen.getByRole("link", { name: "hello@big-emotion.com" })).toHaveAttribute(
      "href",
      "mailto:hello@big-emotion.com",
    );
    expect(screen.getByRole("link", { name: "+33 7 66 26 40 43" })).toHaveAttribute(
      "href",
      "tel:+33766264043",
    );
  });

  it("states the response time and the social handle", () => {
    renderContact("fr");

    expect(screen.getByText("On te répond sous 24 h.")).toBeInTheDocument();
    expect(screen.getByText(/@bigemotion sur les réseaux/)).toBeInTheDocument();
  });

  // The agency answers as a team here; individual names belong to the Culture page.
  it("does not name an individual contact", () => {
    renderContact("fr");

    expect(screen.queryByText("Jean-Noé Kollo")).not.toBeInTheDocument();
  });

  it("carries the contact form itself", () => {
    renderContact("fr");

    expect(screen.getByRole("button", { name: "Envoyer" })).toBeInTheDocument();
  });

  it("answers in English on the English route", () => {
    renderContact("en");

    expect(screen.getByText("We reply within 24 h.")).toBeInTheDocument();
    expect(screen.getByText(/@bigemotion on socials/)).toBeInTheDocument();
  });
});
