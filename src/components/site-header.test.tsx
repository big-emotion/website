import { render, screen } from "@testing-library/react";
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
});
