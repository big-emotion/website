import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Culture } from "./culture";

describe("Culture", () => {
  it("links Sylvain's own site under his name", () => {
    render(<Culture />);
    const site = screen.getByRole("link", { name: /sylvain seng bandith sur son site/i });
    expect(site).toHaveAttribute("href", "https://www.sylvainsengbandith.fr/");
  });

  it("disambiguates the two LinkedIn links, which share the same visible label", () => {
    render(<Culture />);
    expect(
      screen.getByRole("link", { name: "Jean-Noé Kollo sur LinkedIn" }),
    ).toHaveAttribute("href", "https://www.linkedin.com/in/jnkollo/");
    expect(
      screen.getByRole("link", { name: "Sylvain Seng Bandith sur LinkedIn" }),
    ).toHaveAttribute("href", "https://fr.linkedin.com/in/sylvain-sengbandith-83515b28");
  });

  it("opens every founder profile in a new tab without leaking the opener", () => {
    render(<Culture />);
    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    }
  });

  it("credits the client brands alongside the team", () => {
    render(<Culture />);
    expect(screen.getAllByText("Radio France").length).toBeGreaterThan(0);
  });
});
