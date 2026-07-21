import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { personalityAxes } from "@/content/site";
import { PersonalitySlider } from "./personality-slider";

describe("PersonalitySlider", () => {
  it("renders all six axes with both pole labels", () => {
    render(<PersonalitySlider />);
    expect(personalityAxes).toHaveLength(6);
    for (const axis of personalityAxes) {
      expect(screen.getByText(axis.start)).toBeInTheDocument();
      expect(screen.getByText(axis.end)).toBeInTheDocument();
    }
  });

  it("exposes a per-axis screen-reader alternative conveying the lean", () => {
    render(<PersonalitySlider />);
    const groups = screen.getAllByRole("group");
    expect(groups).toHaveLength(6);
    for (const group of groups) {
      const name = group.getAttribute("aria-label") ?? "";
      expect(name).toMatch(/ to .+: (leans|balanced)/);
    }
  });

  it("does not rely on decorative graphics alone: pole labels and dot are hidden from assistive tech", () => {
    render(<PersonalitySlider />);
    const [firstGroup] = screen.getAllByRole("group");
    const decorative = firstGroup.querySelectorAll('[aria-hidden="true"]');
    expect(decorative.length).toBeGreaterThan(0);
  });
});
