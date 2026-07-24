import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import fr from "../../messages/fr.json";
import { BackLink } from "./back-link";

function renderBackLink() {
  return render(
    // The locale-aware `Link` reads the intl context.
    <NextIntlClientProvider locale="fr" messages={fr}>
      <BackLink href="/blog" label="Retour au blog" />
    </NextIntlClientProvider>,
  );
}

describe("BackLink", () => {
  it("points at the listing it came from", () => {
    renderBackLink();

    expect(screen.getByRole("link", { name: "Retour au blog" })).toHaveAttribute("href", "/blog");
  });

  it("keeps the arrow out of the accessible name", () => {
    renderBackLink();

    // The glyph is decoration: a screen reader announcing "left arrow Retour au blog"
    // reads as noise, and the label already says where the link goes.
    expect(screen.getByRole("link", { name: "Retour au blog" })).toHaveAccessibleName(
      "Retour au blog",
    );
  });
});
