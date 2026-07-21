import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Cases } from "./cases";

describe("Cases", () => {
  // The page title and lead live in the accent hero above the section (SWBE-22).
  it("leaves the page title to the hero", () => {
    render(<Cases locale="fr" />);

    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("presents the work by sector rather than by named client", () => {
    render(<Cases locale="fr" />);
    expect(screen.getByRole("heading", { name: /industrie & b2b/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /medias & edition/i })).toBeInTheDocument();
  });

  it("pairs each headline number with the metric it measures", () => {
    render(<Cases locale="fr" />);
    const growth = screen.getByText("+150 %");
    expect(growth.closest("div")).toHaveTextContent("Croissance moyenne");
  });

  it("names the agency's own productions and links them out", () => {
    render(<Cases locale="fr" />);
    expect(screen.getByRole("heading", { name: /ethniafrica/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ethniafrica sur le web/i })).toHaveAttribute(
      "href",
      "https://ethniafrica.com/fr",
    );
  });

  it("links the project standard plugin to its repository", () => {
    render(<Cases locale="fr" />);
    expect(screen.getByRole("heading", { name: /project standard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Project Standard sur GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/big-emotion/project-standard",
    );
  });

  it("keeps Ferry's two distribution links distinguishable out of context", () => {
    render(<Cases locale="fr" />);
    expect(screen.getByRole("link", { name: "Ferry sur GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/big-emotion/ferry",
    );
    expect(screen.getByRole("link", { name: "Ferry sur npm" })).toHaveAttribute(
      "href",
      "https://www.npmjs.com/package/@big-emotion/ferry",
    );
  });

  it("answers in English on the English route, link labels included", () => {
    render(<Cases locale="en" />);

    expect(screen.getByRole("heading", { name: /media & publishing/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Our own productions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ferry on GitHub" })).toBeInTheDocument();
  });

  it("keeps the impact figures readable as a definition list", () => {
    const { container } = render(<Cases locale="fr" />);

    expect(container.querySelectorAll("dl dt")).toHaveLength(2);
    expect(container.querySelectorAll("dl dd")).toHaveLength(2);
  });
});
