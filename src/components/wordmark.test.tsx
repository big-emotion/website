import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Wordmark } from "./wordmark";

describe("Wordmark", () => {
  it("renders the B!G EMOTION lockup with an accessible name", () => {
    render(<Wordmark />);
    expect(screen.getByLabelText("BIG EMOTION")).toBeInTheDocument();
    expect(screen.getByText("B!G")).toBeInTheDocument();
    expect(screen.getByText("EMOTION")).toBeInTheDocument();
  });

  it("can hide the EMOTION line for the oversized footer mark", () => {
    render(<Wordmark stacked={false} />);
    expect(screen.queryByText("EMOTION")).not.toBeInTheDocument();
  });
});
