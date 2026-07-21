import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
  it("offers the public inbox and phone number as actionable links", () => {
    render(<SiteFooter />);

    expect(screen.getByRole("link", { name: "hello@big-emotion.com" })).toHaveAttribute(
      "href",
      "mailto:hello@big-emotion.com",
    );
    expect(screen.getByRole("link", { name: "+33 7 66 26 40 43" })).toHaveAttribute(
      "href",
      "tel:+33766264043",
    );
  });

  // The agency answers as a team here; individual names belong to the Culture section.
  it("does not name an individual contact", () => {
    render(<SiteFooter />);

    expect(screen.queryByText("Jean-Noé Kollo")).not.toBeInTheDocument();
  });
});
