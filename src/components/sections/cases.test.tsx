import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Cases } from "./cases";

describe("Cases", () => {
  it("presents the work by sector rather than by named client", () => {
    render(<Cases />);
    expect(screen.getByRole("heading", { name: /industrie & b2b/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /médias & édition/i })).toBeInTheDocument();
  });

  it("pairs each headline number with the metric it measures", () => {
    render(<Cases />);
    const growth = screen.getByText("+150 %");
    expect(growth.closest("div")).toHaveTextContent("Croissance moyenne");
  });

  it("names the agency's own productions and links them out", () => {
    render(<Cases />);
    expect(screen.getByRole("heading", { name: /ethniafrica/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ethniafrica sur le web/i })).toHaveAttribute(
      "href",
      "https://ethniafrica.com/fr",
    );
  });

  it("keeps Ferry's two distribution links distinguishable out of context", () => {
    render(<Cases />);
    expect(screen.getByRole("link", { name: "Ferry sur GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/big-emotion/ferry",
    );
    expect(screen.getByRole("link", { name: "Ferry sur npm" })).toHaveAttribute(
      "href",
      "https://www.npmjs.com/package/@big-emotion/ferry",
    );
  });
});
