import { describe, expect, it } from "vitest";

import {
  checkCatalogReferences,
  checkExportTraceability,
  checkImplementedCoverage,
  checkTestAnnotation,
  requirementIdsInTests,
  validateCatalog,
} from "./lint-req-annotations.mjs";

const catalog = {
  pageId: "171245569",
  requirements: [
    { id: "REQ-001", title: "Active contract", status: "Implemented" },
    { id: "REQ-002", title: "Future contract", status: "Pending" },
    { id: "REQ-003", title: "Retired contract", status: "Obsolete" },
    { id: "REQ-004", title: "Approved contract", status: "Approved" },
  ],
};

describe("checkTestAnnotation", () => {
  it("accepts a requirement annotation immediately above a Vitest test", () => {
    const source = `
// @req REQ-001
it("keeps the contract", () => {});
`;

    expect(checkTestAnnotation(source, "src/example.test.tsx")).toEqual([]);
  });

  it("accepts annotations on test.each and test.todo definitions", () => {
    const source = `
// @req REQ-001
test.each([1, 2])("handles %s", () => {});
// @req REQ-002
test.todo("documents the future contract");
`;

    expect(checkTestAnnotation(source, "src/example.test.ts")).toEqual([]);
  });

  it("rejects a new unannotated test", () => {
    const source = `it("has no traceability", () => {});`;

    expect(checkTestAnnotation(source, "src/example.test.tsx")).toEqual([
      "src/example.test.tsx:1: missing @req annotation — add // @req REQ-NNN within 3 lines above this test",
    ]);
  });

  it("grandfathers an existing test while rejecting a newly added one", () => {
    const prior = `it("legacy behavior", () => {});`;
    const source = `${prior}
it("new behavior", () => {});`;

    expect(checkTestAnnotation(source, "src/example.test.ts", prior)).toEqual([
      "src/example.test.ts:2: missing @req annotation — add // @req REQ-NNN within 3 lines above this test",
    ]);
  });
});

describe("requirementIdsInTests", () => {
  it("collects unique requirement annotations from supported test files", () => {
    const files = [
      {
        path: "src/a.test.ts",
        content: "// @req REQ-001\n// @req REQ-004\nit('a', () => {});",
      },
      {
        path: "src/b.test.tsx",
        content: "// @req REQ-001\nit('b', () => {});",
      },
      {
        path: "src/runtime.ts",
        content: "// @req REQ-002",
      },
    ];

    expect([...requirementIdsInTests(files)].sort()).toEqual(["REQ-001", "REQ-004"]);
  });
});

describe("checkCatalogReferences", () => {
  it("rejects unknown and obsolete requirement annotations", () => {
    const files = [
      {
        path: "src/example.test.ts",
        content: "// @req REQ-003\n// @req REQ-999\nit('example', () => {});",
      },
    ];

    expect(checkCatalogReferences(files, catalog)).toEqual([
      "src/example.test.ts:1:9: @req REQ-003 references an Obsolete requirement",
      "src/example.test.ts:2:9: @req REQ-999 is absent from docs/confluence-spec/req-catalog.json",
    ]);
  });
});

describe("checkImplementedCoverage", () => {
  it("requires every Implemented or Approved requirement to appear in a test", () => {
    const files = [
      {
        path: "src/example.test.ts",
        content: "// @req REQ-001\nit('example', () => {});",
      },
    ];

    expect(checkImplementedCoverage(files, catalog)).toEqual([
      "REQ-004 (Approved) has no @req annotation in any test file",
    ]);
  });

  it("does not require Pending or Obsolete requirements to have tests", () => {
    const files = [
      {
        path: "src/example.test.tsx",
        content: "// @req REQ-001\n// @req REQ-004\nit('example', () => {});",
      },
    ];

    expect(checkImplementedCoverage(files, catalog)).toEqual([]);
  });
});

describe("validateCatalog", () => {
  it("rejects a catalog that points at a different Confluence Requirements page", () => {
    expect(() => validateCatalog(catalog, "999999999")).toThrow(
      "req-catalog.json pageId 171245569 does not match config requirementsPageId 999999999",
    );
  });

  it("requires titled requirements in monotonic ID order", () => {
    const invalidCatalog = {
      pageId: "171245569",
      requirements: [
        { id: "REQ-002", title: "", status: "Pending" },
        { id: "REQ-001", title: "Earlier contract", status: "Implemented" },
      ],
    };

    expect(() => validateCatalog(invalidCatalog, "171245569")).toThrow(
      "REQ-002 must have a non-empty title",
    );

    invalidCatalog.requirements[0].title = "Later contract";
    expect(() => validateCatalog(invalidCatalog, "171245569")).toThrow(
      "requirements must be ordered by increasing REQ-NNN ID",
    );
  });
});

describe("checkExportTraceability", () => {
  it("accepts a requirement-bearing export when the same ID is tested", () => {
    const files = [
      {
        path: "src/runtime.ts",
        content: "/** @req REQ-001 */\nexport function runtimeContract() {}",
      },
      {
        path: "src/runtime.test.ts",
        content: "// @req REQ-001\nit('tests the contract', () => {});",
      },
    ];

    expect(checkExportTraceability(files)).toEqual([]);
  });

  it("rejects a requirement-bearing export with no matching test annotation", () => {
    const files = [
      {
        path: "src/runtime.ts",
        content: "/**\n * @req REQ-001\n */\nexport const runtimeContract = true;",
      },
    ];

    expect(checkExportTraceability(files)).toEqual([
      "src/runtime.ts:1: exported symbol annotated @req REQ-001 has no matching test annotation",
    ]);
  });
});
