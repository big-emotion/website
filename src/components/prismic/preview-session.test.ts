import { describe, expect, it } from "vitest";
import { hasPreviewSession } from "./preview-session";

// The cookie Prismic sets on the site's domain when an editor starts a preview. Its
// value is a URL-encoded JSON object keyed by repository endpoint.
const previewCookie = (repository: string) =>
  encodeURIComponent(
    JSON.stringify({ [`https://${repository}.prismic.io/api/v2`]: { preview: "ref" } }),
  );

describe("hasPreviewSession", () => {
  it("recognises a preview session for this repository", () => {
    expect(
      hasPreviewSession(`io.prismic.preview=${previewCookie("big-emotion")}`, "big-emotion"),
    ).toBe(true);
  });

  it("ignores a session belonging to another repository", () => {
    expect(
      hasPreviewSession(`io.prismic.preview=${previewCookie("some-other-repo")}`, "big-emotion"),
    ).toBe(false);
  });

  it("reports no session for an ordinary visitor", () => {
    expect(hasPreviewSession("", "big-emotion")).toBe(false);
    expect(hasPreviewSession("espace_session=abc", "big-emotion")).toBe(false);
  });

  it("finds the cookie among others, whatever the spacing", () => {
    const jar = `espace_session=abc;io.prismic.preview=${previewCookie("big-emotion")}; other=1`;

    expect(hasPreviewSession(jar, "big-emotion")).toBe(true);
  });

  it("reports no session when the cookie is present but unreadable", () => {
    expect(hasPreviewSession("io.prismic.preview=not-json", "big-emotion")).toBe(false);
  });
});
