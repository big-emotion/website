import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StageThemeControls } from "./stage-theme-controls";
import { allowedLogoColors, DEFAULT_STAGE_THEME } from "./stage-theme";

function renderControls(onThemeChange = vi.fn()) {
  render(
    <StageThemeControls locale="fr" theme={DEFAULT_STAGE_THEME} onThemeChange={onThemeChange} />,
  );
  return onThemeChange;
}

describe("StageThemeControls", () => {
  // @req REQ-037
  it("keeps the picker collapsed behind its toggle until asked", () => {
    renderControls();

    const toggle = screen.getByRole("button", { name: "Couleurs" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("group", { name: "Fond du stage" })).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("group", { name: "Fond du stage" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Couleur du logo" })).toBeInTheDocument();
  });

  // @req REQ-037
  it("offers all six backdrops but only the allowed logo colours", () => {
    renderControls();
    fireEvent.click(screen.getByRole("button", { name: "Couleurs" }));

    const backdrops = within(screen.getByRole("group", { name: "Fond du stage" }));
    expect(backdrops.getAllByRole("button")).toHaveLength(6);

    const logos = within(screen.getByRole("group", { name: "Couleur du logo" }));
    expect(logos.getAllByRole("button")).toHaveLength(
      allowedLogoColors(DEFAULT_STAGE_THEME.backdrop).length,
    );
  });

  // @req REQ-037
  it("marks the current theme's swatches as pressed", () => {
    renderControls();
    fireEvent.click(screen.getByRole("button", { name: "Couleurs" }));

    const backdrops = within(screen.getByRole("group", { name: "Fond du stage" }));
    expect(backdrops.getByRole("button", { name: "Brutal" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(backdrops.getByRole("button", { name: "Ink" })).toHaveAttribute("aria-pressed", "false");
  });

  // @req REQ-037
  it("reports a backdrop pick with the logo colour kept legal", () => {
    const onThemeChange = renderControls();
    fireEvent.click(screen.getByRole("button", { name: "Couleurs" }));

    const backdrops = within(screen.getByRole("group", { name: "Fond du stage" }));
    fireEvent.click(backdrops.getByRole("button", { name: "Ink" }));

    // Chrome (paper) stays allowed on ink, so only the backdrop moves.
    expect(onThemeChange).toHaveBeenCalledWith({ backdrop: "ink", logo: "paper" });
  });

  // @req REQ-037
  it("reports a logo pick as-is", () => {
    const onThemeChange = renderControls();
    fireEvent.click(screen.getByRole("button", { name: "Couleurs" }));

    const logos = within(screen.getByRole("group", { name: "Couleur du logo" }));
    fireEvent.click(logos.getByRole("button", { name: "Tangerine" }));

    expect(onThemeChange).toHaveBeenCalledWith({ backdrop: "brutal", logo: "tangerine" });
  });
});
