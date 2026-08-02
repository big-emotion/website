import { content, tools } from "@/content/site";
import type { Locale } from "@/i18n/locales";

// One slow row of tool wordmarks under its own eyebrow — the client wall's seamless
// loop (two printings, -50% shift), single row because an inventory is read once,
// not soaked in like a wall. The second printing exists only to close the loop and
// stays out of the accessibility tree.
export function ToolsBand({ locale }: { locale: Locale }) {
  const { toolboxTitle } = content[locale];

  return (
    <section aria-labelledby="tools-band-title" className="mt-16 md:mt-24">
      <h2
        id="tools-band-title"
        className="font-display text-sm tracking-[0.2em] opacity-80 md:text-base"
      >
        {toolboxTitle}
      </h2>

      {/* Full-bleed like the client wall: the row escapes the section's padding so the
          scroll reads as continuous. */}
      <div className="tools-band mt-6 -mx-5 overflow-hidden md:mt-8 md:-mx-8">
        <div className="marquee-track flex w-max">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1 || undefined} className="flex shrink-0">
              {tools.map((tool) => (
                <li
                  key={tool}
                  className="font-display mr-3 whitespace-nowrap border-2 border-current px-5 py-3 text-xl md:mr-4 md:px-7 md:py-4 md:text-3xl"
                >
                  {tool}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
