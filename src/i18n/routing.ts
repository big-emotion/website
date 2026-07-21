import { defineRouting } from "next-intl/routing";
import { defaultLocale, locales } from "./locales";

// FR is the default and is served unprefixed at `/`; EN lives under `/en` (DEC-024,
// REQ-030, ARCH-017 — these supersede the earlier EN-default chain).
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",

  // Language is a URL decision here, not a negotiation: `/` must always serve French.
  // Left on (the default), next-intl would bounce an English-preferring browser from
  // `/` to `/en` via the accept-language header and a NEXT_LOCALE cookie, which would
  // both contradict REQ-030 and make the SSG homepage uncacheable per-visitor.
  localeDetection: false,
});
