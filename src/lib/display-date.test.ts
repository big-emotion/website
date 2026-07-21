import { describe, expect, it } from "vitest";
import { formatPublishDate } from "./display-date";

describe("formatPublishDate", () => {
  // The reason this helper exists: BBH Hegarty has an ASCII-only cmap (DEC-023), so an
  // accented month silently swaps face mid-word in a font-display slot. "21 FEVRIER 2019"
  // is the case that surfaced it on /blog.
  it.each([
    ["2019-02-21", "21 fevrier 2019"],
    ["2026-08-09", "9 aout 2026"],
    ["2026-12-01", "1 decembre 2026"],
  ])("strips the accents French month names carry (%s)", (iso, expected) => {
    expect(formatPublishDate("fr", iso)).toBe(expected);
  });

  it("leaves English dates untouched", () => {
    expect(formatPublishDate("en", "2019-02-21")).toBe("February 21, 2019");
  });

  // Stripping diacritics must not degrade into stripping the letter: a reader should
  // still get "fevrier", never "fvrier".
  it("keeps the base letter of every accented character", () => {
    expect(formatPublishDate("fr", "2019-02-21")).toMatch(/^\d{1,2} [a-z]+ \d{4}$/);
  });
});
