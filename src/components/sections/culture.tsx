import { ClientWall } from "@/components/client-wall";
import { PersonalitySlider } from "@/components/personality-slider";
import { StackedHeadline } from "@/components/stacked-headline";
import { content } from "@/content/site";
import type { Locale } from "@/i18n/locales";

// The /culture route (SWBE-21). Same headline sourcing as /cases: the scene whose id is
// this section's name already carries the localized line for it.
export function Culture({ locale }: { locale: Locale }) {
  const { scenes, leads, team, values } = content[locale];
  const headline = scenes.find((scene) => scene.id === "culture");

  return (
    <section className="overflow-hidden bg-tangerine px-5 py-20 text-ink md:px-8 md:py-32">
      <StackedHeadline
        as="h1"
        lines={headline?.title ?? []}
        className="font-display text-[clamp(2.25rem,9vw,7rem)]"
      />
      <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink/80 md:text-xl">
        {leads.culture}
      </p>

      <div className="mt-14 grid gap-12 md:mt-20 md:grid-cols-2">
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
