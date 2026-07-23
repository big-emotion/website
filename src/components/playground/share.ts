// The player share loop (REQ-038): native share sheet first, clipboard as the
// fallback every browser without `navigator.share` (desktop Firefox, most desktop
// Chrome) still needs. Framework-free on purpose — `EffectHud` is the only caller and
// owns the toast copy/state, this module only reports what actually happened.

export type ShareOutcome = "shared" | "cancelled" | "copied" | "failed";

export type ShareEffectPayload = {
  url: string;
  title: string;
  text?: string;
};

export async function shareEffect(payload: ShareEffectPayload): Promise<ShareOutcome> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(payload);
      return "shared";
    } catch (error) {
      // The user dismissing the native sheet is not a failure — falling back to the
      // clipboard here would silently copy a link nobody asked for.
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(payload.url);
      return "copied";
    } catch {
      return "failed";
    }
  }

  return "failed";
}
