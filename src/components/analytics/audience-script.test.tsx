// @req REQ-051

import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AudienceScript } from "./audience-script";

function measured() {
  process.env.PLAUSIBLE_DOMAIN = "big-emotion.com";
  process.env.PLAUSIBLE_HOST = "https://stats.big-emotion.com";
}

afterEach(() => {
  delete process.env.PLAUSIBLE_DOMAIN;
  delete process.env.PLAUSIBLE_HOST;
});

describe("audience script", () => {
  // @req REQ-051
  it("names the property the events are filed under", () => {
    measured();

    const { container } = render(<AudienceScript />);
    const script = container.querySelector("script");

    expect(script).toHaveAttribute("data-domain", "big-emotion.com");
    expect(script).toHaveAttribute(
      "src",
      "https://stats.big-emotion.com/js/script.outbound-links.js",
    );
  });

  // The scene canvas decodes a Draco GLB on first paint and owns the frame budget there.
  // Measurement is worth nothing if it costs the thing being measured.
  // @req REQ-051
  it("defers, so it never competes with the first paint", () => {
    measured();

    expect(render(<AudienceScript />).container.querySelector("script")).toHaveAttribute("defer");
  });

  // @req REQ-051
  it("renders nothing at all when the build has no measurement configured", () => {
    expect(render(<AudienceScript />).container).toBeEmptyDOMElement();
  });
});
