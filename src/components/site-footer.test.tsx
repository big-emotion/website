import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
  it("signs the site with the brand and the manifesto line", () => {
    render(<SiteFooter locale="fr" />);

    expect(
      screen.getByText(new RegExp(`${new Date().getFullYear()} BIG EMOTION`)),
    ).toBeInTheDocument();
    // Body copy, so the French keeps its accents — DEC-023's ASCII rule covers display
    // slots only, and this line is set in the body face.
    expect(screen.getByText(/on crée de l’impact/)).toBeInTheDocument();
  });

  it("signs off in the visitor's language", () => {
    render(<SiteFooter locale="en" />);

    expect(screen.getByText(/we create impact/)).toBeInTheDocument();
  });

  // Epic precondition 4 (social profile URLs) is still open, and REQ-033 requires a
  // network with no confirmed handle to be omitted rather than linked nowhere.
  it("ships no social links while the profile URLs are unconfirmed", () => {
    const { container } = render(<SiteFooter locale="fr" />);

    expect(container.querySelectorAll("a")).toHaveLength(0);
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
