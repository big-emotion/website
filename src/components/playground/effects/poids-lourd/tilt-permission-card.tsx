"use client";

import { useEffect, useSyncExternalStore } from "react";

export const TILT_PERMISSION_STORAGE_KEY = "playground:poids-lourd:tilt-permission";

// Same-tab localStorage writes don't fire the native "storage" event (that's
// cross-tab only), so `persist` dispatches this to invalidate the
// `useSyncExternalStore` snapshot after a decision is made.
const DECISION_CHANGED_EVENT = "playground:poids-lourd:tilt-permission-changed";

type StoredDecision = "granted" | "denied";

type DeviceOrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission: () => Promise<"granted" | "denied">;
};

type SupportLevel = "absent" | "ungated" | "gated";

function getSupportLevel(): SupportLevel {
  if (typeof DeviceOrientationEvent === "undefined") return "absent";
  const hasPrompt =
    typeof (DeviceOrientationEvent as DeviceOrientationEventWithPermission).requestPermission ===
    "function";
  return hasPrompt ? "gated" : "ungated";
}

function readStoredDecision(): StoredDecision | null {
  const value = window.localStorage.getItem(TILT_PERMISSION_STORAGE_KEY);
  return value === "granted" || value === "denied" ? value : null;
}

function persist(decision: StoredDecision) {
  window.localStorage.setItem(TILT_PERMISSION_STORAGE_KEY, decision);
  window.dispatchEvent(new Event(DECISION_CHANGED_EVENT));
}

function getVisibleSnapshot(): boolean {
  return getSupportLevel() === "gated" && readStoredDecision() === null;
}

// Assume no card on the server so hydration doesn't flash it before the real,
// client-only support/decision check runs — same rationale as scene-canvas.tsx's
// reduced-motion snapshot.
function getServerVisibleSnapshot(): boolean {
  return false;
}

function subscribeToDecision(onChange: () => void) {
  window.addEventListener(DECISION_CHANGED_EVENT, onChange);
  return () => window.removeEventListener(DECISION_CHANGED_EVENT, onChange);
}

export type TiltPermissionCardCopy = {
  title: string;
  body: string;
  enable: string;
  dismiss: string;
};

/**
 * Gesture-gated tilt permission (REQ-039): only iOS 13+ Safari requires an explicit,
 * user-gesture-triggered `DeviceOrientationEvent.requestPermission()` call before
 * `deviceorientation` fires — every other browser fires it unprompted, so the card
 * only ever renders on that one platform family. Tilt is flavor, never required to
 * play: dismissing (or simply never having gyroscope support) leaves the pointer
 * grab/drag/throw gesture fully functional. The decision persists in localStorage so
 * a visitor is never asked twice.
 */
export function TiltPermissionCard({
  copy,
  onGranted,
  onUnavailable,
}: {
  copy: TiltPermissionCardCopy;
  onGranted: () => void;
  onUnavailable: () => void;
}) {
  const visible = useSyncExternalStore(
    subscribeToDecision,
    getVisibleSnapshot,
    getServerVisibleSnapshot,
  );

  useEffect(() => {
    const level = getSupportLevel();
    if (level === "absent") {
      onUnavailable();
      return;
    }
    if (level === "ungated") {
      onGranted();
      return;
    }
    if (readStoredDecision() === "granted") onGranted();
    // "denied" or no decision yet -> nothing to call, the card renders instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  async function handleEnable() {
    const ctor = DeviceOrientationEvent as DeviceOrientationEventWithPermission;
    const result = await ctor.requestPermission();
    persist(result);
    if (result === "granted") onGranted();
  }

  function handleDismiss() {
    persist("denied");
  }

  return (
    <div className="bg-ink text-paper fixed inset-x-5 bottom-5 z-10 flex flex-col gap-3 p-5 md:inset-x-8">
      <p className="font-display text-lg uppercase tracking-wide">{copy.title}</p>
      <p className="text-sm">{copy.body}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleEnable}
          className="font-display bg-lemon text-ink px-4 py-2 text-sm uppercase tracking-wide"
        >
          {copy.enable}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="font-display px-4 py-2 text-sm uppercase tracking-wide opacity-70"
        >
          {copy.dismiss}
        </button>
      </div>
    </div>
  );
}
