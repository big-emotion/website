import { content } from "@/content/site";
import type { Locale } from "@/i18n/locales";

// The /cases route. Its title and lead sit in the accent hero above (SWBE-22), so the
// section opens straight onto the numbers.
export function Cases({ locale }: { locale: Locale }) {
  const { impactStats, cases, productionsIntro, productions } = content[locale];

  return (
    <section className="bg-lyon px-5 py-20 text-paper md:px-8 md:py-32">

      {/* gap-px over a lighter backdrop draws the hairline dividers, same brutalist
          grid idiom as the Approach services. flex-col-reverse puts the number above
          its label while keeping the <dt>-before-<dd> order the markup requires. */}
      <dl className="grid gap-px bg-paper/40 md:grid-cols-2">
        {impactStats.map((stat, index) => (
          <div
            key={stat.label}
            // The first cell stays flush with the section edge so it lines up with the
            // hero above; the rest clear the hairline divider they sit against.
            className={`flex flex-col-reverse bg-lyon py-8 md:py-10 ${index > 0 ? "md:pl-8" : ""}`}
          >
            <dt className="font-display mt-2 text-sm uppercase tracking-wide opacity-80 md:text-base">
              {stat.label}
            </dt>
            <dd className="font-display text-[clamp(3rem,13vw,7rem)] leading-[0.85] text-lemon">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-14 grid gap-12 md:mt-20 md:grid-cols-2 md:gap-8">
        {cases.map((project) => (
          <article key={project.slug} className="border-t-2 border-paper pt-6">
            <p className="font-display text-sm uppercase tracking-wide opacity-70">
              {project.kind}
            </p>
            <h2 className="font-display mt-2 text-[clamp(1.6rem,7vw,4rem)] text-lemon [overflow-wrap:anywhere]">
              {project.title}
            </h2>
            <p className="mt-4 max-w-prose text-lg leading-relaxed">{project.summary}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <li
                  key={tag}
                  className="border border-paper/40 px-3 py-1 text-xs uppercase tracking-wide"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      {/* The sector cards say what we do; this block says what we shipped. It sits at the
          end of the page, in lemon, so the eye lands on the only work here that can be
          opened in a new tab. */}
      <section aria-labelledby="productions-title" className="mt-20 md:mt-28">
        <h2
          id="productions-title"
          className="font-display border-t-2 border-lemon pt-6 text-sm uppercase tracking-[0.2em] text-lemon md:text-base"
        >
          {productionsIntro.title}
        </h2>
        <p className="mt-3 max-w-prose text-lg leading-relaxed opacity-80">
          {productionsIntro.body}
        </p>

        <div className="mt-10 grid gap-12 md:mt-14 md:grid-cols-2 md:gap-8">
          {productions.map((production) => (
            <article key={production.slug}>
              <p className="font-display text-sm uppercase tracking-wide opacity-70">
                {production.kind}
              </p>
              <h3 className="font-display mt-2 text-[clamp(1.6rem,7vw,4rem)] text-lemon [overflow-wrap:anywhere]">
                {production.title}
              </h3>
              <p className="mt-4 max-w-prose text-lg leading-relaxed">{production.summary}</p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {production.tags.map((tag) => (
                  <li
                    key={tag}
                    className="border border-paper/40 px-3 py-1 text-xs uppercase tracking-wide"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
              <ul className="mt-4 flex flex-wrap gap-2">
                {production.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${production.title} ${link.context}`}
                      className="font-display inline-block border-2 border-lemon px-3 py-1 text-xs uppercase tracking-wide text-lemon transition-colors hover:bg-lemon hover:text-lyon"
                    >
                      {link.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
