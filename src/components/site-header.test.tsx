import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// next/link needs an app-router context to mount; for a unit test we only care that
// the header renders the four destinations, so a passthrough anchor is enough.
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("exposes the four brand sections", () => {
    render(<SiteHeader />);
    for (const label of ["Approach", "Cases & Impact", "Culture", "Contact"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("links the Espace client CTA out to the support portal in a new tab", () => {
    render(<SiteHeader />);

    const cta = screen.getByRole("link", { name: "Espace client" });
    expect(cta).toHaveAttribute("href", "https://support.big-emotion.com/");
    expect(cta).toHaveAttribute("target", "_blank");
    expect(cta).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("repeats the Espace client CTA inside the mobile drawer", () => {
    render(<SiteHeader />);
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));

    const drawer = document.getElementById("mobile-nav");
    expect(drawer).not.toBeNull();
    expect(within(drawer!).getByRole("link", { name: "Espace client" })).toHaveAttribute(
      "href",
      "https://support.big-emotion.com/",
    );
  });
});
