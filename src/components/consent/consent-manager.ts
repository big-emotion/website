/**
 * Loads and configures tarteaucitron (`public/tarteaucitron/`, vendored — see the README
 * there).
 *
 * ON-DEMAND, and that is a deliberate limitation. Nothing on this site needs consent
 * before it runs: the only cookies set are strictly necessary, so tarteaucitron shows no
 * banner to anyone and exists purely as the panel behind the footer's cookie-settings
 * button. Loading ~320 kB on every page to power a button almost nobody presses would be
 * hard to defend on a site that self-hosts its fonts to avoid one third-party request.
 *
 * THIS STOPS BEING CORRECT the moment a script needs consent — analytics, an embedded
 * video, a marketing pixel. A consent manager that loads on click cannot hold anything
 * back, so that change means registering the service in `CONSENT_SERVICES` *and* loading
 * this eagerly from the layout instead.
 */

/** Only the surface this module actually calls. */
type TarteaucitronGlobal = {
  init: (parameters: Record<string, unknown>) => void;
  userInterface: { openPanel: () => void };
  job: string[];
};

declare global {
  interface Window {
    tarteaucitron?: TarteaucitronGlobal;
    /** Read by the library at load time; without it the banner follows the browser. */
    tarteaucitronForceLanguage?: string;
  }
}

const SCRIPT_SRC = "/tarteaucitron/tarteaucitron.min.js";

/** Fired on `window` once the library has built its panel and is safe to drive. */
const READY_EVENT = "tac.root_available";

/**
 * The cookie tarteaucitron stores the visitor's choices in.
 *
 * Named after the brand rather than left at the library's default `tarteaucitron`, so the
 * privacy policy can name it without explaining what a tarteaucitron is.
 * `consent-manager.test.ts` checks the policy and this constant still agree.
 */
export const CONSENT_COOKIE_NAME = "bigemotion_consent";

/**
 * Services whose scripts must wait for consent. Empty today — the site loads no
 * third-party script at all. See the module note above before adding the first one.
 */
export const CONSENT_SERVICES: readonly string[] = [];

export function consentParameters(privacyUrl: string): Record<string, unknown> {
  return {
    privacyUrl,
    cookieName: CONSENT_COOKIE_NAME,
    // Bottom band rather than the library's centred modal: the panel is reached
    // deliberately from the footer, never sprung on a reader mid-scroll.
    orientation: "bottom",
    bodyPosition: "bottom",
    // No floating cookie tab. The footer button is the only entry point, and a permanent
    // badge over a full-bleed scroll experience would fight the design.
    showIcon: false,
    showAlertSmall: false,
    // Nothing is granted until it is chosen, and refusing is exactly as easy as accepting
    // — the CNIL asks for symmetry between the two.
    highPrivacy: true,
    AcceptAllCta: true,
    DenyAllCta: true,
    // Lists the cookies actually in use inside the panel, which is the point of opening it
    // on a site with nothing to consent to.
    cookieslist: true,
    groupServices: false,
    removeCredit: false,
  };
}

let pendingLoad: Promise<TarteaucitronGlobal> | undefined;

/**
 * Resolves once tarteaucitron is loaded, initialised and ready to be driven. Repeat calls
 * share one load.
 *
 * @param language the route locale, so the panel speaks the page's language
 * @param privacyPath site-relative path of the privacy policy, resolved to an absolute URL
 *   because the library compares it against `window.location.href`
 */
export function loadConsentManager(
  language: string,
  privacyPath: string,
): Promise<TarteaucitronGlobal> {
  pendingLoad ??= new Promise((resolve, reject) => {
    window.tarteaucitronForceLanguage = language;

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;

    script.addEventListener("error", () => {
      // Let the next click try again rather than leaving a rejected promise cached.
      pendingLoad = undefined;
      reject(new Error("Could not load the consent manager"));
    });

    script.addEventListener("load", () => {
      const tarteaucitron = window.tarteaucitron;
      if (!tarteaucitron) {
        pendingLoad = undefined;
        reject(new Error("Consent manager loaded without exposing its API"));
        return;
      }

      window.addEventListener(READY_EVENT, () => resolve(tarteaucitron), { once: true });

      tarteaucitron.init(
        consentParameters(new URL(privacyPath, window.location.origin).toString()),
      );
      tarteaucitron.job = [...CONSENT_SERVICES];
    });

    document.head.appendChild(script);
  });

  return pendingLoad;
}
