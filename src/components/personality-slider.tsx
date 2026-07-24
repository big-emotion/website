import { useTranslations } from "next-intl";
import { content, personalityAxes } from "@/content/site";
import type { Locale } from "@/i18n/locales";

export function PersonalitySlider({ locale }: { locale: Locale }) {
  const t = useTranslations("culture");
  const { personalityPoles } = content[locale];

  // The line and the dot are pure graphics, so each axis carries its reading as text:
  // which two poles it spans and which way the brand sits on it.
  const axisDescription = (start: string, end: string, position: number) => {
    if (position === 50) return t("axisBalanced", { start, end });
    const pole = position < 50 ? start : end;
    return t("axisLeans", { start, end, pole: pole.toLowerCase() });
  };

  return (
    <div className="mt-16 md:mt-24">
      <h2 className="font-display text-sm tracking-[0.2em] opacity-80">{t("personalityTitle")}</h2>
      <ul className="mt-6 flex flex-col gap-6">
        {personalityAxes.map((axis) => {
          const { start, end } = personalityPoles[axis.id];

          return (
            // French poles run longer than the brand book's English ("Institutionnel" for
            // "Corporate"), so on mobile the two labels sit above a full-width line rather
            // than squeezing three columns into 320px, where they clipped mid-word.
            <li
              key={axis.id}
              role="group"
              aria-label={axisDescription(start, end, axis.position)}
              className="grid grid-cols-2 items-center gap-x-4 gap-y-2 md:grid-cols-[minmax(0,7rem)_1fr_minmax(0,7rem)] md:gap-4"
            >
              <span
                aria-hidden="true"
                className="truncate text-sm md:order-1 md:text-right md:text-base"
              >
                {start}
              </span>
              <span
                aria-hidden="true"
                className="truncate text-right text-sm md:order-3 md:text-left md:text-base"
              >
                {end}
              </span>
              <span
                aria-hidden="true"
                className="relative col-span-2 h-px min-w-0 bg-ink/70 md:order-2 md:col-span-1"
              >
                <span className="personality-slider-dot" style={{ left: `${axis.position}%` }} />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
