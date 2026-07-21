import { useTranslations } from "next-intl";
import { clients } from "@/content/site";

// Two rows scrolling in opposite directions, so the wall reads as a wall and not as a
// second manifesto band. Both rows carry the *full* roster on purpose: the -50% loop
// only stays seamless while one copy is wider than the viewport, and half a roster
// (~1660px) would tear open on a wide display. The second row starts mid-list so the
// two rows never line up the same brand — it repeats the same names, so it is purely
// decorative and stays out of the accessibility tree.
const HALF = Math.ceil(clients.length / 2);
const rows = [clients, [...clients.slice(HALF), ...clients.slice(0, HALF)]];

export function ClientWall() {
  const t = useTranslations("culture");

  return (
    <section aria-labelledby="client-wall-title" className="mt-16 md:mt-24">
      <h2
        id="client-wall-title"
        className="font-display text-sm tracking-[0.2em] opacity-80 md:text-base"
      >
        {t("clientWallTitle")}
      </h2>

      {/* Full-bleed: the rows escape the section's horizontal padding so wordmarks run
          edge to edge, which is what makes the scroll feel continuous. */}
      <div className="client-wall-rows mt-6 -mx-5 space-y-3 md:mt-8 md:-mx-8">
        {rows.map((row, index) => {
          const decorative = index > 0;
          return (
            <div
              key={index}
              // Reduced motion unwraps the rows into a static grid, where a second copy
              // of the same roster is just noise — globals.css drops it on this flag.
              data-decorative={decorative}
              className="client-wall-row overflow-hidden"
            >
              <div
                className={`marquee-track flex w-max ${decorative ? "marquee-track--reverse" : ""}`}
              >
                {[0, 1].map((copy) => (
                  <ul key={copy} aria-hidden={decorative || copy === 1} className="flex shrink-0">
                    {row.map((brand) => (
                      <li
                        key={brand}
                        className="font-display mr-3 whitespace-nowrap border-2 border-ink px-5 py-3 text-xl md:mr-4 md:px-7 md:py-4 md:text-3xl"
                      >
                        {brand}
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
