import { describe, expect, it } from "vitest";
import { cases, impactStats, services, site, team, values } from "./site";

// BBH Hegarty has an ASCII-only cmap: an accent in display type falls back to
// another face and renders visibly mismatched. These are the strings the
// components hand to a `font-display` element — body copy is exempt and keeps
// correct French, so this guards the slots rather than the whole module.
const DISPLAY_COPY = [
  site.mission,
  site.stat.label,
  ...services.map((service) => service.title),
  ...impactStats.map((stat) => stat.label),
  ...cases.flatMap((sector) => [sector.title, sector.kind]),
  ...team.flatMap((member) => [member.name, member.role]),
  ...values,
];

describe("display-font copy", () => {
  it.each(DISPLAY_COPY)("renders %s without accented characters", (copy) => {
    expect(copy).not.toMatch(/[À-ſ]/);
  });

  it("keeps the schema.org founder name correctly accented", () => {
    expect(site.contact.person).toBe("Jean-Noé Kollo");
  });

  it("leaves body copy in correct French", () => {
    expect(site.baseline).toContain("crée");
  });
});
