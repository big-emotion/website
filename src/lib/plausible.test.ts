// @req REQ-051

import { afterEach, describe, expect, it } from "vitest";
import { audienceMeasurement } from "./plausible";

const CONFIGURED = {
  PLAUSIBLE_DOMAIN: "big-emotion.com",
  PLAUSIBLE_HOST: "https://stats.big-emotion.com",
};

function configure(overrides: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries({ ...CONFIGURED, ...overrides })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

afterEach(() => {
  delete process.env.PLAUSIBLE_DOMAIN;
  delete process.env.PLAUSIBLE_HOST;
});

describe("audience measurement", () => {
  // @req REQ-051
  it("points at the instance BIG EMOTION runs itself", () => {
    configure({});

    expect(audienceMeasurement()).toEqual({
      domain: "big-emotion.com",
      scriptSrc: "https://stats.big-emotion.com/js/script.outbound-links.js",
    });
  });

  // @req REQ-051
  it("stays off entirely when no domain is registered", () => {
    configure({ PLAUSIBLE_DOMAIN: undefined });

    expect(audienceMeasurement()).toBeNull();
  });

  // A missing host used to be the moment a self-hosted setup quietly became a hosted one:
  // the vendor's own SDK defaults to plausible.io. Here that default would send every
  // visitor's IP to a third party while the privacy policy still claimed none was made, so
  // a half-configured build measures nothing rather than measuring somewhere else.
  // @req REQ-051
  it("refuses to fall back to the vendor's hosted instance", () => {
    configure({ PLAUSIBLE_HOST: undefined });

    expect(audienceMeasurement()).toBeNull();
  });

  // @req REQ-051
  it("tolerates a host written with a trailing slash", () => {
    configure({ PLAUSIBLE_HOST: "https://stats.big-emotion.com/" });

    expect(audienceMeasurement()?.scriptSrc).toBe(
      "https://stats.big-emotion.com/js/script.outbound-links.js",
    );
  });

  // Whitespace survives a copy-paste into a VPS `.env` far more often than anyone expects,
  // and an empty string is not a configured value.
  // @req REQ-051
  it("treats a blank value as unconfigured", () => {
    configure({ PLAUSIBLE_DOMAIN: "   " });

    expect(audienceMeasurement()).toBeNull();
  });
});
