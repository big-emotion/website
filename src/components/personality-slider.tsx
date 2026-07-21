import { useTranslations } from "next-intl";
import { personalityAxes } from "@/content/site";

export function PersonalitySlider() {
  const t = useTranslations("culture");

  // The line and the dot are pure graphics, so each axis carries its reading as text:
  // which two poles it spans and which way the brand sits on it.
  const axisDescription = (start: string, end: string, position: number) => {
    if (position === 50) return t("axisBalanced", { start, end });
    const pole = position < 50 ? start : end;
    return t("axisLeans", { start, end, pole: pole.toLowerCase() });
  };

  return (
    <div className="mt-16 md:mt-24">
      <h2 className="font-display text-sm tracking-[0.2em] opacity-80">
        {t("personalityTitle")}
      </h2>
      <ul className="mt-6 flex flex-col gap-6">
        {personalityAxes.map((axis) => (
          <li
            key={`${axis.start}-${axis.end}`}
            role="group"
            aria-label={axisDescription(axis.start, axis.end, axis.position)}
            className="grid grid-cols-[minmax(0,4.5rem)_1fr_minmax(0,4.5rem)] items-center gap-3 md:grid-cols-[minmax(0,7rem)_1fr_minmax(0,7rem)] md:gap-4"
          >
            <span aria-hidden="true" className="truncate text-right text-sm md:text-base">
              {axis.start}
            </span>
            <span aria-hidden="true" className="relative h-px min-w-0 bg-ink/70">
              <span className="personality-slider-dot" style={{ left: `${axis.position}%` }} />
            </span>
            <span aria-hidden="true" className="truncate text-sm md:text-base">
              {axis.end}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
