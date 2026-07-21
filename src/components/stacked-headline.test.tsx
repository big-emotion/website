import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StackedHeadline } from "./stacked-headline";

describe("StackedHeadline", () => {
  // The whole point of the component: the line break is a visual device, so the text a
  // screen reader announces must still be a sentence.
  it("reads as a sentence even though each line renders on its own row", () => {
    render(<StackedHeadline lines={["Derriere", "chaque clic,", "une emotion"]} />);

    expect(screen.getByRole("heading")).toHaveAccessibleName("Derriere chaque clic, une emotion");
  });

  it("renders as a level-2 heading by default and a level-1 on request", () => {
    const { rerender } = render(<StackedHeadline lines={["Votre marque,", "en plus fort"]} />);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();

    rerender(<StackedHeadline as="h1" lines={["Votre marque,", "en plus fort"]} />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders a single-line headline without a stray leading space", () => {
    render(<StackedHeadline lines={["Culture"]} />);

    expect(screen.getByRole("heading")).toHaveAccessibleName("Culture");
  });
});
