import { getLocale } from "next-intl/server";
import { content } from "@/content/site";
import type { Locale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";

export const metadata = { title: "404" };

// Branded 404. Uses Brutal Grey, the one palette swatch the marketing pages don't
// otherwise call for. Reached both from an explicit notFound() and from the catch-all
// segment that swallows unknown paths, so it renders inside the locale layout and can
// answer in the visitor's language.
export default async function NotFound() {
  const locale = (await getLocale()) as Locale;
  const { notFound } = content[locale];

  return (
    <section className="flex min-h-[80svh] flex-col justify-center bg-brutal px-5 py-24 text-ink md:px-8">
      <p className="font-display text-sm tracking-[0.2em] opacity-70">{notFound.label}</p>
      <h1 className="font-display mt-4 text-[clamp(4rem,22vw,15rem)] leading-none">404</h1>
      <p className="mt-6 max-w-xl text-xl md:text-2xl">{notFound.body}</p>
      <Link
        href="/"
        className="font-display mt-8 inline-block w-fit bg-ink px-6 py-4 text-lg uppercase tracking-wide text-lemon hover:opacity-80"
      >
        {notFound.back}
      </Link>
    </section>
  );
}
