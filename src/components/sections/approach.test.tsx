import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Approach } from "./approach";

describe("Approach", () => {
  // The page title and lead moved into the accent hero (SWBE-22), so the section opens
  // on the mission — the agency's statement of method, which appears nowhere else.
  it("opens on the agency's mission rather than repeating the page title", () => {
    render(<Approach locale="fr" />);

    expect(screen.getByRole("heading", { name: /On fait du sur-mesure/ })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("answers in English on the English route", () => {
    render(<Approach locale="en" />);

    expect(screen.getByRole("heading", { name: /We build custom/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Custom development" })).toBeInTheDocument();
  });

  // The offer is two trades plus what the agency sells on top of them, and the order
  // is the argument: the wow lands last because the first two are table stakes.
  it("ranks the two trades before the wow they are sold with", () => {
    render(<Approach locale="fr" />);

    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((heading) => heading.textContent)).toEqual([
      "On fait du sur-mesure et du conseil. On y ajoute ce qui fait dire wow.",
      "Conseil & plan marketing",
      "Developpement sur-mesure",
      "La touche wow",
    ]);
  });

  it("closes the English offer on the same wow", () => {
    render(<Approach locale="en" />);

    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.at(-1)).toHaveTextContent("The wow touch");
  });

  it("pairs the project count with what it counts", () => {
    render(<Approach locale="fr" />);

    expect(screen.getByText(/50\+/)).toBeInTheDocument();
    expect(screen.getByText("projets accompagnes")).toBeInTheDocument();
  });
});
