import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SUBPAGE_PHOTOS, SubpageHero } from "./subpage-hero";

const LINES = ["L'agence", "qui fait", "dire wow"] as const;
const LEAD = "On part de la reaction, puis on remonte tout le fil pour l'obtenir.";

function renderHero(page: "approach" | "cases" | "culture" | "contact" = "approach") {
  return render(<SubpageHero page={page} title={LINES} lead={LEAD} />);
}

describe("SubpageHero", () => {
  it("gives the page its single h1, reading as a sentence across the authored lines", () => {
    renderHero();

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveAccessibleName("L'agence qui fait dire wow");
  });

  it("shows the lead paragraph", () => {
    renderHero();

    expect(screen.getByText(LEAD)).toBeInTheDocument();
  });

  // The accent is the one thing that distinguishes the four pages visually, and the
  // brand tokens are the only permitted source for it (REQ-002 forbids a raw hex).
  it.each([
    ["approach", "bg-lemon", "text-ink"],
    ["cases", "bg-tangerine", "text-ink"],
    ["culture", "bg-lyon", "text-paper"],
    ["contact", "bg-ink", "text-lemon"],
  ] as const)("paints %s with its accent tokens", (page, background, ink) => {
    const { container } = renderHero(page);

    const banner = container.querySelector("section");
    expect(banner).toHaveClass(background);
    expect(banner).toHaveClass(ink);
  });

  it("never inlines a raw brand hex", () => {
    const { container } = renderHero("contact");

    expect(container.innerHTML).not.toMatch(/#(f2ff26|ff5200|0024cc|dbdbdb)/i);
  });
});

describe("SubpageHero photo slot", () => {
  // SWBE-91 has shipped no photography, so every page is on the placeholder path.
  // The placeholder carries no meaning, so it must not reach the accessibility tree —
  // and it must not request an image that does not exist.
  it("renders a decorative placeholder while no photo is configured", () => {
    const { container } = renderHero();

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("[data-testid='subpage-photo-placeholder']")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  // Mobile shows the photo above the headline, but that is a visual reordering only:
  // the heading has to stay first in the document so it leads for assistive tech and
  // for the document outline. Getting this backwards would bury the h1 behind a
  // decorative placeholder.
  it("keeps the heading ahead of the photo in reading order", () => {
    const { container } = renderHero();

    const slots = [...container.querySelectorAll("[data-subpage-slot]")];
    expect(slots.map((slot) => slot.getAttribute("data-subpage-slot"))).toEqual([
      "text",
      "photo",
    ]);
  });

  // Guards the hand-off to SWBE-91: it should only have to drop files in and fill this
  // map. A stray src here would ship a 404 into the hero.
  it("declares no photo source until SWBE-91 delivers", () => {
    expect(Object.values(SUBPAGE_PHOTOS).every((photo) => photo === null)).toBe(true);
  });
});
