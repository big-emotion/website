import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home", () => {
  it("leads with the brand hero headline", () => {
    render(<Home />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent(/agency that gives a wow/i);
  });

  it("renders the manifesto voice lines", () => {
    render(<Home />);
    // The marquee duplicates its track for a seamless loop, so the line appears twice.
    expect(screen.getAllByText("Your brand, but louder.").length).toBeGreaterThan(0);
  });

  it("anchors the Approach, Cases and Culture sections for the nav", () => {
    const { container } = render(<Home />);
    for (const id of ["approach", "cases", "culture"]) {
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    }
  });
});
