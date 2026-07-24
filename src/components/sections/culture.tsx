import { PersonalitySlider } from "@/components/personality-slider";
import { TeamMarquee } from "@/components/team-marquee";
import { content } from "@/content/site";
import type { Locale } from "@/i18n/locales";

// The /culture route. Its title and lead sit in the accent hero above (SWBE-22), so the
// section opens straight onto the team.
export function Culture({ locale }: { locale: Locale }) {
  const { team, values } = content[locale];

  return (
    <section className="overflow-hidden bg-tangerine px-5 py-20 text-ink md:px-8 md:py-32">
      <TeamMarquee members={team} />

      <PersonalitySlider />

      <p className="font-display mt-16 text-xl md:mt-24 md:text-3xl">{values.join("  ·  ")}</p>
    </section>
  );
}
