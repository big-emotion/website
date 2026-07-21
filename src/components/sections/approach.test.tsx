import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Approach } from "./approach";

describe("Approach", () => {
  it("titles the page with the agency's mission", () => {
    render(<Approach locale="fr" />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Donner vie a tes projets",
    );
  });

  it("introduces the page with its own lead, not the home page's", () => {
    render(<Approach locale="fr" />);

    expect(screen.getByText(/On part de la réaction/)).toBeInTheDocument();
  });

  it("answers in English on the English route", () => {
    render(<Approach locale="en" />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Bring your projects to life",
    );
    expect(screen.getByRole("heading", { name: "Custom development" })).toBeInTheDocument();
  });

  it("ranks the three service offers under the page title", () => {
    render(<Approach locale="fr" />);

    const services = screen.getAllByRole("heading", { level: 2 });
    expect(services.map((heading) => heading.textContent)).toEqual([
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
