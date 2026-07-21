import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArticleHeader } from "./article-header";

describe("ArticleHeader", () => {
  it("renders the title as the page's single h1", () => {
    render(<ArticleHeader locale="fr" title="Le brief qui change tout" kind="Strategie de marque" date="2026-07-21" />);

    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Le brief qui change tout");
  });

  it("credits the kind as an eyebrow above the title", () => {
    render(<ArticleHeader locale="fr" title="Le brief qui change tout" kind="Strategie de marque" date="2026-07-21" />);

    expect(screen.getByText("Strategie de marque")).toBeInTheDocument();
  });

  it("formats the date for the rendered locale while keeping the raw value in datetime", () => {
    render(<ArticleHeader locale="fr" title="Titre" kind="Kind" date="2026-07-21" />);

    const time = screen.getByText(/21 juillet 2026/i);
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("datetime", "2026-07-21");
  });

  it("formats the date in English on the English route", () => {
    render(<ArticleHeader locale="en" title="Title" kind="Kind" date="2026-07-21" />);

    expect(screen.getByText(/July 21, 2026/i)).toBeInTheDocument();
  });

  it("omits author and reading time when not provided", () => {
    const { container } = render(<ArticleHeader locale="fr" title="Titre" kind="Kind" date="2026-07-21" />);

    expect(container.querySelector("time")?.parentElement?.textContent).toBe("21 juillet 2026");
  });

  it("shows author and reading time when provided", () => {
    render(
      <ArticleHeader
        locale="fr"
        title="Titre"
        kind="Kind"
        date="2026-07-21"
        author="Camille"
        readingTime="6 min"
      />,
    );

    expect(screen.getByText(/Camille/)).toBeInTheDocument();
    expect(screen.getByText(/6 min/)).toBeInTheDocument();
  });
});
