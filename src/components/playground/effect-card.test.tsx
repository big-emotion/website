import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import fr from "../../../messages/fr.json";
import { EffectCard } from "./effect-card";

function renderCard() {
  return render(
    <NextIntlClientProvider locale="fr" messages={fr}>
      <EffectCard
        href="/playground/poids-lourd"
        title="Poids Lourd"
        hook="Saisis, glisse et lance le logo chromé contre des murs élastiques."
        playLabel="Jouer"
        preview="drop"
      />
    </NextIntlClientProvider>,
  );
}

describe("EffectCard", () => {
  it("names the effect and hooks it in one line", () => {
    renderCard();

    expect(screen.getByRole("heading", { level: 2, name: "Poids Lourd" })).toBeInTheDocument();
    expect(screen.getByText(/murs élastiques/)).toBeInTheDocument();
  });

  // PG-03: the whole card is the target, so the visitor never has to find the button.
  // One link, whose accessible name carries the effect — "Jouer" alone would give three
  // identically-named links on the gallery (WCAG 2.4.4).
  it("exposes exactly one link, named after the effect it opens", () => {
    const { container } = renderCard();

    expect(container.querySelectorAll("a")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Poids Lourd" })).toHaveAttribute(
      "href",
      "/playground/poids-lourd",
    );
  });

  it("keeps the hook and the play pill out of the name that has to tell three cards apart", () => {
    renderCard();

    expect(screen.getByRole("link", { name: "Poids Lourd" })).toHaveAccessibleName("Poids Lourd");
    expect(screen.getByText("Jouer")).toHaveAttribute("aria-hidden", "true");
  });

  // The preview is a CSS composition of the wordmark, never the 3D scene: the gallery's
  // budget is zero WebGL until an effect is opened (DEC-030).
  it("previews the effect without mounting any canvas", () => {
    const { container } = renderCard();

    expect(container.querySelector("canvas")).toBeNull();
    expect(screen.getByTestId("effect-card-preview")).toBeInTheDocument();
  });
});
