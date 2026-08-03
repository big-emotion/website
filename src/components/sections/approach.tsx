import { ToolsBand } from "@/components/tools-band";
import { content } from "@/content/site";
import type { Locale } from "@/i18n/locales";

// The /approach route. The page title and lead now sit in the accent hero above
// (SWBE-22), so the mission opens the section instead of repeating them — it is the
// agency's own statement of method and appears nowhere else.
export function Approach({ locale }: { locale: Locale }) {
  const { mission, services, expertise, stat } = content[locale];

  return (
    <section
      data-header-ink="text-ink"
      data-header-surface="bg-paper"
      className="bg-paper px-5 py-20 text-ink md:px-8 md:py-32"
    >
      <h2 className="font-display max-w-5xl text-[clamp(2rem,6.5vw,5.5rem)]">{mission}</h2>

      {/* gap-px over an ink backdrop draws hairline dividers — brutalist grid. */}
      <div className="mt-14 grid gap-px bg-ink md:mt-20 md:grid-cols-3">
        {services.map((service, i) => (
          <article key={service.title} className="bg-paper p-6 md:p-8">
            <span className="font-display text-2xl text-tangerine">0{i + 1}</span>
            <h2 className="font-display mt-4 text-2xl">{service.title}</h2>
            <p className="mt-3 text-base leading-relaxed text-ink/80">{service.body}</p>
          </article>
        ))}
      </div>

      {/* The cards above say how the agency works; this list is the offer in plain
          words, one deliverable per line at the service-card title size — twelve
          headline-sized rows read as a second wall, not a catalogue. */}
      <div className="mt-16 md:mt-24">
        <h2
          id="expertise-title"
          className="font-display text-sm tracking-[0.2em] opacity-80 md:text-base"
        >
          {expertise.title}
        </h2>
        <p className="mt-4 max-w-prose text-lg leading-relaxed text-ink/80">{expertise.lead}</p>
        <ul aria-labelledby="expertise-title" className="mt-6 border-t border-ink/20">
          {expertise.items.map((item) => (
            <li key={item} className="font-display border-b border-ink/20 py-3 text-2xl">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <ToolsBand locale={locale} />

      <div className="mt-16 md:mt-24">
        <p className="font-display text-[clamp(3.5rem,18vw,13rem)] leading-[0.8]">
          {stat.value}
          <span className="text-tangerine">.</span>
        </p>
        <p className="font-display text-lg tracking-wide md:text-2xl">{stat.label}</p>
      </div>
    </section>
  );
}
