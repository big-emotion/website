import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { content, personalityAxes } from "@/content/site";
import type { Locale } from "@/i18n/locales";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import { PersonalitySlider } from "./personality-slider";

const messages = { fr, en };

function renderSlider(locale: Locale = "fr") {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      <PersonalitySlider locale={locale} />
    </NextIntlClientProvider>,
  );
}

describe("PersonalitySlider", () => {
  it("renders all six axes with both pole labels", () => {
    renderSlider();
    expect(personalityAxes).toHaveLength(6);
    for (const axis of personalityAxes) {
      const poles = content.fr.personalityPoles[axis.id];
      expect(screen.getByText(poles.start)).toBeInTheDocument();
      expect(screen.getByText(poles.end)).toBeInTheDocument();
    }
  });

  it("names the poles in French for a French visitor", () => {
    renderSlider("fr");
    expect(screen.getByText("Formel")).toBeInTheDocument();
    expect(screen.getByText("Décontracté")).toBeInTheDocument();
    expect(screen.getByText("Chaleureux")).toBeInTheDocument();
    expect(screen.queryByText("Casual")).not.toBeInTheDocument();
  });

  it("names the poles in English for an English visitor", () => {
    renderSlider("en");
    expect(screen.getByText("Formal")).toBeInTheDocument();
    expect(screen.getByText("Casual")).toBeInTheDocument();
    expect(screen.queryByText("Décontracté")).not.toBeInTheDocument();
  });

  it("exposes a per-axis screen-reader alternative conveying the lean", () => {
    renderSlider("en");
    const groups = screen.getAllByRole("group");
    expect(groups).toHaveLength(6);
    for (const group of groups) {
      const name = group.getAttribute("aria-label") ?? "";
      expect(name).toMatch(/ to .+: (leans|balanced)/);
    }
  });

  it("describes the lean in French for a French visitor", () => {
    renderSlider("fr");

    // Formel/Decontracte sits at 54 — past the middle, so it leans towards the end pole.
    expect(
      screen.getByRole("group", { name: "Formel a Décontracté : penche vers décontracté" }),
    ).toBeInTheDocument();
  });

  it("titles the slider in the visitor's language", () => {
    renderSlider("fr");
    expect(screen.getByRole("heading", { name: "Personnalite de marque" })).toBeInTheDocument();
  });

  it("does not rely on decorative graphics alone: pole labels and dot are hidden from assistive tech", () => {
    renderSlider();
    const [firstGroup] = screen.getAllByRole("group");
    const decorative = firstGroup.querySelectorAll('[aria-hidden="true"]');
    expect(decorative.length).toBeGreaterThan(0);
  });
});
