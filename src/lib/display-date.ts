import type { Locale } from "@/i18n/locales";

const INTL_LOCALES: Record<Locale, string> = { fr: "fr-FR", en: "en-US" };

/**
 * A publication date for a `font-display` slot.
 *
 * BBH Hegarty has an ASCII-only cmap (DEC-023), so an accented glyph silently falls back
 * to another face mid-word. Every display string authored in `site.ts` is written
 * unaccented for that reason and `site.test.ts` enforces it — but a date is built at
 * runtime by `Intl`, so it slips past that guard entirely. French is where it shows:
 * `dateStyle: "long"` yields "21 février 2019", which the blog uppercases into
 * "21 FÉVRIER 2019" with the É in the wrong typeface.
 *
 * Only use this where the result lands in `font-display`. Elsewhere the accents render
 * correctly and stripping them would just be worse typography.
 */
export function formatPublishDate(locale: Locale, isoDate: string): string {
  const formatted = new Intl.DateTimeFormat(INTL_LOCALES[locale], { dateStyle: "long" }).format(
    new Date(isoDate),
  );

  // Decompose, then drop the combining marks: "é" becomes "e" + U+0301, and removing the
  // mark leaves the base letter. Deleting the accented character outright would give
  // "fvrier".
  return formatted.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}
