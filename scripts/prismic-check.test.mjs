import { describe, expect, it } from "vitest";

import { deepDiff, normalizeForDiff } from "./prismic-check.mjs";

describe("deepDiff", () => {
  it("reports no drift for structurally identical models", () => {
    const model = { id: "case_study", json: { Principal: { title: { type: "Text" } } } };

    expect(deepDiff(model, structuredClone(model))).toEqual([]);
  });

  it("reports a changed field type with its path", () => {
    const diffs = deepDiff(
      { json: { title: { type: "Text" } } },
      { json: { title: { type: "StructuredText" } } },
    );

    expect(diffs).toEqual([
      { kind: "value-changed", path: "json.title.type", local: "Text", remote: "StructuredText" },
    ]);
  });

  it("distinguishes a field added locally from one only present remotely", () => {
    const diffs = deepDiff(
      { json: { title: {}, client: {} } },
      { json: { title: {}, legacy: {} } },
    );

    expect(diffs).toContainEqual({ kind: "added-local", path: "json.client", local: {} });
    expect(diffs).toContainEqual({ kind: "added-remote", path: "json.legacy", remote: {} });
  });

  it("walks arrays element by element", () => {
    const diffs = deepDiff({ variations: ["default"] }, { variations: ["default", "wide"] });

    expect(diffs).toEqual([{ kind: "added-remote", path: "variations[1]", remote: "wide" }]);
  });

  it("flags a container whose type changed rather than descending into it", () => {
    expect(deepDiff({ labels: [] }, { labels: {} })).toEqual([
      { kind: "type-changed", path: "labels", local: "array", remote: "object" },
    ]);
  });
});

describe("normalizeForDiff", () => {
  it("strips Slice Machine thumbnails, which exist only on the remote", () => {
    const slice = {
      id: "case_chapter",
      variations: [{ id: "default", imageUrl: "https://images.prismic.io/thumb.png" }],
    };

    expect(normalizeForDiff(slice).variations[0]).toEqual({ id: "default" });
  });

  it("leaves the caller's slice untouched", () => {
    const slice = { variations: [{ id: "default", imageUrl: "https://images.prismic.io/x.png" }] };

    normalizeForDiff(slice);

    expect(slice.variations[0].imageUrl).toBe("https://images.prismic.io/x.png");
  });

  it("passes custom types through, since they carry no variations", () => {
    const customType = { id: "case_study", json: {} };

    expect(normalizeForDiff(customType)).toBe(customType);
  });

  it("makes a thumbnail-only difference invisible to the gate", () => {
    const local = { id: "case_chapter", variations: [{ id: "default" }] };
    const remote = { id: "case_chapter", variations: [{ id: "default", imageUrl: "https://x" }] };

    expect(deepDiff(normalizeForDiff(local), normalizeForDiff(remote))).toEqual([]);
  });
});
