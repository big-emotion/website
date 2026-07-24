import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TILT_PERMISSION_STORAGE_KEY, TiltPermissionCard } from "./tilt-permission-card";

const copy = {
  title: "Incliner pour jouer",
  body: "Autorise l'inclinaison pour ajouter un peu de gravite au geste.",
  enable: "Activer",
  dismiss: "Non merci",
};

function stubDeviceOrientationEvent(requestPermission?: () => Promise<"granted" | "denied">) {
  const ctor = requestPermission
    ? Object.assign(function DeviceOrientationEvent() {}, { requestPermission })
    : function DeviceOrientationEvent() {};
  vi.stubGlobal("DeviceOrientationEvent", ctor);
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("TiltPermissionCard", () => {
  it("renders nothing and reports unavailable when the device has no orientation events at all", () => {
    vi.stubGlobal("DeviceOrientationEvent", undefined);
    const onGranted = vi.fn();
    const onUnavailable = vi.fn();

    render(<TiltPermissionCard copy={copy} onGranted={onGranted} onUnavailable={onUnavailable} />);

    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();
    expect(onUnavailable).toHaveBeenCalledTimes(1);
    expect(onGranted).not.toHaveBeenCalled();
  });

  it("renders nothing and grants immediately on browsers that don't gate orientation behind a prompt", () => {
    stubDeviceOrientationEvent(); // no requestPermission -> Android/older iOS/desktop
    const onGranted = vi.fn();

    render(<TiltPermissionCard copy={copy} onGranted={onGranted} onUnavailable={vi.fn()} />);

    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();
    expect(onGranted).toHaveBeenCalledTimes(1);
  });

  it("shows the card on iOS-style gated browsers with no prior decision", () => {
    stubDeviceOrientationEvent(() => Promise.resolve("granted"));

    render(<TiltPermissionCard copy={copy} onGranted={vi.fn()} onUnavailable={vi.fn()} />);

    expect(screen.getByText(copy.title)).toBeInTheDocument();
  });

  it("requests permission on a user gesture, persists the grant, and never re-shows", async () => {
    const requestPermission = vi.fn(() => Promise.resolve("granted" as const));
    stubDeviceOrientationEvent(requestPermission);
    const onGranted = vi.fn();

    render(<TiltPermissionCard copy={copy} onGranted={onGranted} onUnavailable={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: copy.enable }));
    await vi.waitFor(() => expect(onGranted).toHaveBeenCalled());

    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(onGranted).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();
    expect(window.localStorage.getItem(TILT_PERMISSION_STORAGE_KEY)).toBe("granted");
  });

  it("persists a denial and never calls onGranted when the OS prompt is refused", async () => {
    const requestPermission = vi.fn(() => Promise.resolve("denied" as const));
    stubDeviceOrientationEvent(requestPermission);
    const onGranted = vi.fn();

    render(<TiltPermissionCard copy={copy} onGranted={onGranted} onUnavailable={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: copy.enable }));
    await vi.waitFor(() =>
      expect(window.localStorage.getItem(TILT_PERMISSION_STORAGE_KEY)).toBe("denied"),
    );

    expect(onGranted).not.toHaveBeenCalled();
  });

  it("dismisses without prompting and never asks again — tilt is never required to play", () => {
    const requestPermission = vi.fn(() => Promise.resolve("granted" as const));
    stubDeviceOrientationEvent(requestPermission);
    const onGranted = vi.fn();

    render(<TiltPermissionCard copy={copy} onGranted={onGranted} onUnavailable={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: copy.dismiss }));

    expect(requestPermission).not.toHaveBeenCalled();
    expect(onGranted).not.toHaveBeenCalled();
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();
    expect(window.localStorage.getItem(TILT_PERMISSION_STORAGE_KEY)).toBe("denied");
  });

  it("honors a prior grant from an earlier visit without showing the card again", () => {
    stubDeviceOrientationEvent(() => Promise.resolve("granted"));
    window.localStorage.setItem(TILT_PERMISSION_STORAGE_KEY, "granted");
    const onGranted = vi.fn();

    render(<TiltPermissionCard copy={copy} onGranted={onGranted} onUnavailable={vi.fn()} />);

    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();
    expect(onGranted).toHaveBeenCalledTimes(1);
  });

  it("honors a prior denial from an earlier visit without re-prompting", () => {
    stubDeviceOrientationEvent(() => Promise.resolve("granted"));
    window.localStorage.setItem(TILT_PERMISSION_STORAGE_KEY, "denied");
    const onGranted = vi.fn();

    render(<TiltPermissionCard copy={copy} onGranted={onGranted} onUnavailable={vi.fn()} />);

    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();
    expect(onGranted).not.toHaveBeenCalled();
  });
});
