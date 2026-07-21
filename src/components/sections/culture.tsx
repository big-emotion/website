import { ClientWall } from "@/components/client-wall";
import { PersonalitySlider } from "@/components/personality-slider";
import { content } from "@/content/site";
import type { Locale } from "@/i18n/locales";

// The /culture route. Its title and lead sit in the accent hero above (SWBE-22), so the
// section opens straight onto the team.
export function Culture({ locale }: { locale: Locale }) {
  const { team, values } = content[locale];

  return (
    <section className="overflow-hidden bg-tangerine px-5 py-20 text-ink md:px-8 md:py-32">

      <div className="grid gap-12 md:grid-cols-2">
        {team.map((member) => (
          <article key={member.name}>
            <h2 className="font-display text-[clamp(1.75rem,5vw,3.25rem)]">{member.name}</h2>
            <p className="font-display mt-1 text-sm uppercase tracking-wide text-ink/80">
              {member.role}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {member.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name} ${link.context}`}
                    className="font-display inline-block border-2 border-ink px-3 py-1 text-xs uppercase tracking-wide transition-colors hover:bg-ink hover:text-tangerine"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 max-w-prose text-lg leading-relaxed">{member.bio}</p>
          </article>
        ))}
      </div>

      <PersonalitySlider />

      <ClientWall />

      <p className="font-display mt-16 text-xl md:mt-24 md:text-3xl">{values.join("  ·  ")}</p>
    </section>
  );
}
