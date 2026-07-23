import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo } from "./logo";

describe("Logo", () => {
  // The mark exists so the header's scroll/sub-page ink and the footer's ink-on-lemon
  // band drive it for free — that only holds if it paints with currentColor and never
  // bakes in the lemon the source file ships with (globals.css owns the brand tokens).
  it("inherits the caller's text colour instead of hardcoding lemon", () => {
    const { container } = render(<Logo />);

    expect(container.querySelector("svg")).toHaveAttribute("fill", "currentColor");
    expect(container.innerHTML).not.toMatch(/f2ff26/i);
  });

  // Header vs. oversized footer size it with different height/width utilities.
  it("forwards the sizing className to the svg", () => {
    const { container } = render(<Logo className="h-10 w-auto" />);

    expect(container.querySelector("svg")).toHaveClass("h-10", "w-auto");
  });

  // Decorative: every call site already names the brand (header link, footer copyright),
  // so the mark must not announce "BIG EMOTION" a second time.
  it("stays out of the accessibility tree", () => {
    const { container } = render(<Logo />);

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
