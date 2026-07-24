import { describe, expect, it } from "vitest";
import { hasPublishedBody } from "./legal-body";

describe("hasPublishedBody", () => {
  it("treats a real legal text as published", () => {
    expect(
      hasPublishedBody(
        "BIG EMOTION, SASU au capital de 500 euros, dont le siege social est situe a Paris.",
      ),
    ).toBe(true);
  });

  it("treats a missing document as unpublished, so the mandatory copy renders", () => {
    expect(hasPublishedBody(undefined)).toBe(false);
    expect(hasPublishedBody(null)).toBe(false);
  });

  // An editor who creates the document but never fills the body would otherwise ship a
  // legal page with a heading and nothing under it.
  it("treats an emptied body as unpublished", () => {
    expect(hasPublishedBody("")).toBe(false);
    expect(hasPublishedBody("   \n  ")).toBe(false);
  });

  it("treats a placeholder too short to be a legal text as unpublished", () => {
    expect(hasPublishedBody("A remplir")).toBe(false);
  });
});
