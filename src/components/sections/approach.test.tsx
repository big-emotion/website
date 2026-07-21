import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Approach } from "./approach";

describe("Approach", () => {
  // The page title and lead moved into the accent hero (SWBE-22), so the section opens
  // on the mission — the agency's statement of method, which appears nowhere else.
  it("opens on the agency's mission rather than repeating the page title", () => {
    render(<Approach locale="fr" />);

    expect(screen.getByRole("heading", { name: /Donner vie a tes projets/ })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("answers in English on the English route", () => {
    render(<Approach locale="en" />);

    expect(
      screen.getByRole("heading", { name: /Bring your projects to life/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Custom development" })).toBeInTheDocument();
  });

  it("ranks the three service offers after the mission", () => {
    render(<Approach locale="fr" />);

    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((heading) => heading.textContent)).toEqual([
      "Donner vie a tes projets et leur transmettre des emotions.",
      "Etude, conception & realisation",
      "Conseil & plan marketing",
      "Developpement sur-mesure",
    ]);
  });

  it("pairs the project count with what it counts", () => {
    render(<Approach locale="fr" />);

    expect(screen.getByText(/50\+/)).toBeInTheDocument();
    expect(screen.getByText("projets accompagnes")).toBeInTheDocument();
  });
});
