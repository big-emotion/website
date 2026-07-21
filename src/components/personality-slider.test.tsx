import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { personalityAxes } from "@/content/site";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import { PersonalitySlider } from "./personality-slider";

const messages = { fr, en };

function renderSlider(locale: "fr" | "en" = "fr") {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      <PersonalitySlider />
    </NextIntlClientProvider>,
  );
}

describe("PersonalitySlider", () => {
  it("renders all six axes with both pole labels", () => {
    renderSlider();
    expect(personalityAxes).toHaveLength(6);
    for (const axis of personalityAxes) {
      expect(screen.getByText(axis.start)).toBeInTheDocument();
      expect(screen.getByText(axis.end)).toBeInTheDocument();
    }
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

    // Formal/Casual sits at 54 — past the middle, so it leans towards the end pole.
    expect(
      screen.getByRole("group", { name: "Formal a Casual : penche vers casual" }),
    ).toBeInTheDocument();
  });

  it("titles the slider in the visitor's language", () => {
    renderSlider("fr");
    expect(screen.getByRole("heading", { name: "Brand personality" })).toBeInTheDocument();
  });

  it("does not rely on decorative graphics alone: pole labels and dot are hidden from assistive tech", () => {
    renderSlider();
    const [firstGroup] = screen.getAllByRole("group");
    const decorative = firstGroup.querySelectorAll('[aria-hidden="true"]');
    expect(decorative.length).toBeGreaterThan(0);
  });
});
