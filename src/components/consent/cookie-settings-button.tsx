"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Locale } from "@/i18n/locales";
import { loadConsentManager } from "./consent-manager";

/**
 * The footer's way into cookie settings — and the only one, since the manager shows no
 * banner and no floating badge (see `consent-manager.ts`).
 *
 * A button rather than a link: it opens a panel on the current page, and a reader who
 * middle-clicks a link expecting a new tab should not get one that goes nowhere.
 */
export function CookieSettingsButton({
  locale,
  privacyHref,
  className,
}: {
  locale: Locale;
  privacyHref: string;
  className?: string;
}) {
  const t = useTranslations("consent");
  const [isLoading, setIsLoading] = useState(false);

  async function openCookieSettings() {
    setIsLoading(true);

    try {
      const consentManager = await loadConsentManager(locale, privacyHref);
      consentManager.userInterface.openPanel();
    } catch {
      // The manager is fetched on click, so it can fail where a bundled one could not —
      // offline, or blocked by an extension. The privacy policy documents the same
      // cookies in prose, so send the reader there rather than leaving a dead button.
      window.location.assign(privacyHref);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={openCookieSettings}
      aria-busy={isLoading}
      className={className}
    >
      {t("manageCookies")}
    </button>
  );
}
