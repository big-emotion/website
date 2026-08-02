import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { content, tools } from "@/content/site";
import { ToolsBand } from "./tools-band";

describe("ToolsBand", () => {
  it("prints the full toolbox once in the reading order, twice on screen for the loop", () => {
    const { container } = render(<ToolsBand locale="fr" />);

    const band = within(screen.getByRole("region", { name: content.fr.toolboxTitle }));
    expect(band.getAllByRole("listitem")).toHaveLength(tools.length);
    // The second printing exists only to close the loop and stays out of the tree.
    expect(container.querySelectorAll("ul")).toHaveLength(2);
    expect(container.querySelector("ul[aria-hidden='true']")).not.toBeNull();
  });

  it("titles the band in the visitor's language", () => {
    render(<ToolsBand locale="en" />);

    expect(screen.getByRole("heading", { name: content.en.toolboxTitle })).toBeInTheDocument();
  });
});
