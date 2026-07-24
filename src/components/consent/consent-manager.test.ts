import { describe, expect, it } from "vitest";
import { legalContent } from "@/content/legal";
import { locales } from "@/i18n/locales";
import { CONSENT_COOKIE_NAME, CONSENT_SERVICES, consentParameters } from "./consent-manager";

describe("consent parameters", () => {
  it("stores choices under the cookie the privacy policy names", () => {
    // The policy tells readers which cookies exist by name. If the configured name drifts
    // from the documented one, the page is quietly lying — in the one document whose only
    // job is to be accurate.
    for (const locale of locales) {
      const cookieSection = legalContent[locale]["politique-de-confidentialite"].sections
        .flatMap((section) => section.paragraphs)
        .join(" ");

      expect(cookieSection).toContain(CONSENT_COOKIE_NAME);
    }

    expect(consentParameters("https://big-emotion.com/politique-de-confidentialite/")).toMatchObject(
      { cookieName: CONSENT_COOKIE_NAME },
    );
  });

  it("makes refusing exactly as available as accepting", () => {
    const parameters = consentParameters("https://big-emotion.com/politique-de-confidentialite/");

    expect(parameters).toMatchObject({ AcceptAllCta: true, DenyAllCta: true, highPrivacy: true });
  });

  it("links the banner to the privacy policy", () => {
    const privacyUrl = "https://big-emotion.com/politique-de-confidentialite/";

    expect(consentParameters(privacyUrl)).toMatchObject({ privacyUrl });
  });

  it("shows no floating badge, since the footer button is the way in", () => {
    expect(consentParameters("https://big-emotion.com/")).toMatchObject({ showIcon: false });
  });

  // Guards the module's central claim. On-demand loading is only defensible while nothing
  // needs holding back; registering a service without switching to an eager load would
  // let that script run before anyone consented to it.
  it("registers no consent-gated service while the manager loads on demand", () => {
    expect(CONSENT_SERVICES).toHaveLength(0);
  });
});
