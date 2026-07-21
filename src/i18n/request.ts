import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

// `messages/*.json` carries UI affordances only — aria labels, form microcopy, the
// skip link. Marketing copy stays in `src/content/site.ts` (ARCH-017, AGENTS.md).
export default getRequestConfig(async ({ requestLocale }) => {
  // The `[locale]` segment also swallows unknown top-level paths, so what arrives here
  // is not necessarily a locale we support — narrow it rather than trust it.
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
