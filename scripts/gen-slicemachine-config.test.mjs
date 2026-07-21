import { describe, expect, it } from "vitest";

import { BASE_CONFIG, apiEndpointFor, repointConfig } from "./gen-slicemachine-config.mjs";

describe("apiEndpointFor", () => {
  it("builds the CDN v2 endpoint for a repository", () => {
    expect(apiEndpointFor("big-emotion")).toBe("https://big-emotion.cdn.prismic.io/api/v2");
  });
});

describe("repointConfig", () => {
  it("repoints both repository-bound values at the target repository", () => {
    const config = JSON.parse(repointConfig(BASE_CONFIG, "big-emotion-staging"));

    expect(config.repositoryName).toBe("big-emotion-staging");
    expect(config.apiEndpoint).toBe("https://big-emotion-staging.cdn.prismic.io/api/v2");
  });

  it("leaves every other setting untouched", () => {
    const config = JSON.parse(repointConfig(BASE_CONFIG, "another-repo"));

    expect(config.adapter).toBe("@slicemachine/adapter-next");
    expect(config.libraries).toEqual(["./src/slices"]);
    expect(config.localSliceSimulatorURL).toBe("http://localhost:3000/slice-simulator");
  });

  it("is idempotent, so regenerating an up-to-date file is a no-op", () => {
    const once = repointConfig(BASE_CONFIG, "big-emotion");

    expect(repointConfig(once, "big-emotion")).toBe(once);
  });

  it("keeps libraries on a single line so regeneration stays diff-free", () => {
    expect(repointConfig(BASE_CONFIG, "big-emotion")).toContain('"libraries": ["./src/slices"]');
  });
});
