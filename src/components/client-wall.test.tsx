import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClientWall } from "./client-wall";
import { clients } from "@/content/site";

const announcedRows = () =>
  screen.getAllByRole("list").filter((list) => list.getAttribute("aria-hidden") !== "true");

describe("ClientWall", () => {
  it("credits every brand the agency has worked with", () => {
    render(<ClientWall />);
    for (const brand of clients) {
      expect(screen.getAllByText(brand).length).toBeGreaterThan(0);
    }
  });

  it("states the roster once, however many times it is repeated on screen", () => {
    render(<ClientWall />);
    const [row, ...extra] = announcedRows();
    expect(extra).toHaveLength(0);
    expect(within(row).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      ...clients,
    ]);
  });

  it("carries the full roster in every row, so no row is narrower than a wide viewport", () => {
    render(<ClientWall />);
    for (const list of screen.getAllByRole("list", { hidden: true })) {
      expect(within(list).getAllByRole("listitem", { hidden: true })).toHaveLength(
        clients.length,
      );
    }
  });
});
