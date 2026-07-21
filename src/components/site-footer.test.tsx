import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
  it("signs the site with the brand and its tagline", () => {
    render(<SiteFooter locale="fr" />);

    expect(
      screen.getByText(new RegExp(`${new Date().getFullYear()} BIG EMOTION`)),
    ).toBeInTheDocument();
    expect(screen.getByText(/L'agence B!G qui fait dire wow/)).toBeInTheDocument();
  });

  it("signs off in the visitor's language", () => {
    render(<SiteFooter locale="en" />);

    expect(screen.getByText(/The B!G agency that gives a wow/)).toBeInTheDocument();
  });

  // It renders on every route, so anything that belongs to one page — the contact
  // details and the form — has to live on /contact instead.
  it("carries no contact surface of its own", () => {
    const { container } = render(<SiteFooter locale="fr" />);

    expect(container.querySelector("form")).toBeNull();
    expect(screen.queryByRole("link", { name: "hello@big-emotion.com" })).not.toBeInTheDocument();
  });

  it("keeps the oversized wordmark decorative, since the brand is already named below", () => {
    const { container } = render(<SiteFooter locale="fr" />);

    const wordmark = container.querySelector('[aria-label="BIG EMOTION"]');
    expect(wordmark?.closest('[aria-hidden="true"]')).not.toBeNull();
  });
});
