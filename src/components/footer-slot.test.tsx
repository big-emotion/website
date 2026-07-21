import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FooterSlot } from "./footer-slot";

const usePathname = vi.hoisted(() => vi.fn());
vi.mock("@/i18n/navigation", () => ({ usePathname }));

describe("FooterSlot", () => {
  it("drops the footer on the home scroll story, which closes on its own final beat", () => {
    usePathname.mockReturnValue("/");
    render(
      <FooterSlot>
        <footer>band</footer>
      </FooterSlot>,
    );
    expect(screen.queryByText("band")).not.toBeInTheDocument();
  });

  it("keeps the footer on every other route", () => {
    usePathname.mockReturnValue("/approach/");
    render(
      <FooterSlot>
        <footer>band</footer>
      </FooterSlot>,
    );
    expect(screen.getByText("band")).toBeInTheDocument();
  });

  // next-intl's usePathname strips the locale prefix, so English routes report the
  // same "/" as French ones — pin it, since a raw next/navigation pathname would
  // report "/en" here and leak the band back onto the English home page.
  it("treats the localized home the same as the default one", () => {
    usePathname.mockReturnValue("/");
    const { container } = render(
      <FooterSlot>
        <footer>band</footer>
      </FooterSlot>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
