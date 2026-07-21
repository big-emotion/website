import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "./hero";

describe("Hero", () => {
  it("announces the agency line as the page heading", () => {
    render(<Hero />);
    expect(
      screen.getByRole("heading", { level: 1, name: /agency that gives a wow/i }),
    ).toBeInTheDocument();
  });

  // The scroll cue shipped as a bare <span>: it looked clickable and did nothing.
  // Asserting the link role (not a class) is what proves a visitor can act on it.
  it("offers the scroll cue as a link into the first section", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: /scroll/i })).toHaveAttribute(
      "href",
      "#approach",
    );
  });
});
