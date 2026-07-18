import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

describe("next.config.ts", () => {
  it("uses standalone output", () => {
    expect(nextConfig.output).toBe("standalone");
  });

  it("redirects all legacy WordPress URLs with 301", async () => {
    const redirects = await nextConfig.redirects!();
    const sources = redirects.map((r) => r.source);
    expect(sources).toContain("/contactez-nous");
    expect(sources).toContain("/les-membres");
    expect(sources).toContain("/case-study-mamiezi");
    expect(sources).toContain("/case-study-adolebatisseur");
    for (const r of redirects) {
      expect(r.permanent).toBe(true);
    }
  });

  it("redirects legacy URLs to the correct one-page anchors", async () => {
    const redirects = await nextConfig.redirects!();
    const find = (src: string) => redirects.find((r) => r.source === src);
    expect(find("/contactez-nous")?.destination).toBe("/#contact");
    expect(find("/les-membres")?.destination).toBe("/#culture");
    expect(find("/case-study-mamiezi")?.destination).toBe("/#cases");
    expect(find("/case-study-adolebatisseur")?.destination).toBe("/#cases");
  });

  it("applies production security headers to all routes", async () => {
    const rules = await nextConfig.headers!();
    const headers = rules.flatMap((r) => r.headers);
    const keys = headers.map((h) => h.key);
    expect(keys).toContain("X-Content-Type-Options");
    expect(keys).toContain("X-Frame-Options");
    expect(keys).toContain("Strict-Transport-Security");
    expect(keys).toContain("Referrer-Policy");
  });

  it("sets HSTS with a one-year max-age", async () => {
    const rules = await nextConfig.headers!();
    const headers = rules.flatMap((r) => r.headers);
    const hsts = headers.find((h) => h.key === "Strict-Transport-Security");
    expect(hsts?.value).toMatch(/max-age=31536000/);
  });

  it("does not set X-Robots-Tag unconditionally", async () => {
    const rules = await nextConfig.headers!();
    const headers = rules
      .filter((r) => r.source === "/(.*)")
      .flatMap((r) => r.headers);
    expect(headers.map((h) => h.key)).not.toContain("X-Robots-Tag");
  });
});
