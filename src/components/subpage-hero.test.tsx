import { render, screen } from "@testing-library/react";
import { existsSync } from "node:fs";
import { join } from "node:path";
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
  // The photo sits beside the h1 and the lead, which carry the whole message. It adds
  // atmosphere and nothing a screen reader needs, so it ships as decorative: an empty
  // alt keeps it out of the accessibility tree rather than reading a description
  // nobody asked for.
  it.each(["approach", "cases", "culture", "contact"] as const)(
    "renders %s's photo as decorative",
    (page) => {
      const { container } = renderHero(page);

      const photo = container.querySelector("img");
      expect(photo).toHaveAttribute("alt", "");
      expect(container.querySelector("[data-testid='subpage-photo-placeholder']")).toBeNull();
    },
  );

  // Mobile shows the photo above the headline, but that is a visual reordering only:
  // the heading has to stay first in the document so it leads for assistive tech and
  // for the document outline. Getting this backwards would bury the h1 behind a
  // decorative photo.
  it("keeps the heading ahead of the photo in reading order", () => {
    const { container } = renderHero();

    const slots = [...container.querySelectorAll("[data-subpage-slot]")];
    expect(slots.map((slot) => slot.getAttribute("data-subpage-slot"))).toEqual([
      "text",
      "photo",
    ]);
  });

  // next/image takes the declared dimensions on faith to reserve the box, so a src that
  // resolves to nothing still lays out correctly and only fails as a 404 in the browser.
  // Reading the real files is what catches a typo or a photo dropped from public/.
  it.each(Object.entries(SUBPAGE_PHOTOS))("serves %s's photo from public/", (_page, photo) => {
    expect(existsSync(join(process.cwd(), "public", photo!.src))).toBe(true);
    expect(photo!.width).toBeGreaterThan(0);
    expect(photo!.height).toBeGreaterThan(photo!.width);
  });
});
