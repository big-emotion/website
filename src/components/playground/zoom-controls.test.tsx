import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ZoomControls } from "./zoom-controls";

afterEach(cleanup);

describe("ZoomControls", () => {
  // The bug this closes: both effects put the zoom behind "hold a mouse button and turn
  // the wheel", a gesture a Mac trackpad cannot produce — so the visitor turned the
  // wheel, the page scrolled under them, and the logo never moved.
  it("gives the visitor a pressable way in and out, no mouse required", () => {
    const onZoom = vi.fn();
    render(<ZoomControls locale="fr" onZoom={onZoom} />);

    fireEvent.click(screen.getByRole("button", { name: /zoomer sur le logo/i }));
    expect(onZoom).toHaveBeenLastCalledWith("in");

    fireEvent.click(screen.getByRole("button", { name: /dézoomer/i }));
    expect(onZoom).toHaveBeenLastCalledWith("out");
  });

  it("names the trackpad and wheel gestures, so they stop being guesswork", () => {
    render(<ZoomControls locale="fr" onZoom={vi.fn()} />);

    expect(screen.getByText(/pincez/i)).toBeInTheDocument();
    expect(screen.getByText(/ctrl/i)).toBeInTheDocument();
  });

  it("speaks the visitor's language", () => {
    render(<ZoomControls locale="en" onZoom={vi.fn()} />);

    expect(screen.getByRole("button", { name: /zoom in on the logo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zoom out/i })).toBeInTheDocument();
    expect(screen.getByText(/pinch/i)).toBeInTheDocument();
  });
});
