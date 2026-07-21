// The locale list lives in its own module rather than in routing.ts so that the
// content layer can depend on it without pulling in next-intl (and the server-only
// routing config) from a Vitest unit test.
//
// FR is the default and is served unprefixed at `/` — the live site has always been
// FR-first, so moving it under a prefix would break every indexed URL (DEC-024).
export const locales = ["fr", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
