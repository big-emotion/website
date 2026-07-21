import { StackedHeadline } from "./stacked-headline";
import { SUBPAGE_ACCENTS, type SubpageId } from "./subpage-accents";
import { SubpagePhoto } from "./subpage-photo";

type Photo = { src: string; alt: string; width: number; height: number };

/**
 * TODO(SWBE-91): fill these in once brand-compliant photography exists under
 * `public/photos/`. Deliberately empty rather than pointing at the designer's prototype
 * JPEGs: two of those four carry third-party trademarks and all are below the 1600px
 * floor, so shipping them as BIG EMOTION assets would be an IP risk. Until then every
 * page renders the placeholder, and wiring a photo is a one-line change here.
 */
export const SUBPAGE_PHOTOS: Record<SubpageId, Photo | null> = {
  approach: null,
  cases: null,
  culture: null,
  contact: null,
};

/**
 * The accent band at the top of each section route (SWBE-22): giant page title and lead
 * on one side, photo on the other.
 *
 * The accent covers this band alone: the section below keeps the colour it already
 * shipped with, which is what makes this a styling change rather than a redesign of
 * reviewed work.
 *
 * Mobile puts the photo above the headline, per the ticket's locked decision — but as a
 * visual reorder only. The heading stays first in the document so it leads the outline
 * and assistive tech, and the photo is decorative anyway.
 */
export function SubpageHero({
  page,
  title,
  lead,
}: {
  page: SubpageId;
  title: readonly string[];
  lead: string;
}) {
  return (
    <section
      className={`${SUBPAGE_ACCENTS[page].surface} px-5 pt-28 pb-12 md:px-8 md:pt-36 md:pb-20`}
    >
      <div className="grid items-center gap-7 md:grid-cols-[1.05fr_0.95fr] md:gap-[clamp(1.75rem,5vw,4.75rem)]">
        <div data-subpage-slot="text" className="min-w-0">
          <StackedHeadline
            as="h1"
            lines={title}
            className="font-display subpage-rise subpage-rise--title text-[clamp(2.75rem,9.4vw,8.9rem)]"
          />
          <p className="subpage-rise subpage-rise--lead mt-6 max-w-[46ch] text-[clamp(1.0625rem,1.6vw,1.625rem)] leading-[1.4] opacity-90 md:mt-8">
            {lead}
          </p>
        </div>

        {/* Second in the document, first on screen below 768px (`order` in globals.css). */}
        <div data-subpage-slot="photo" className="subpage-photo-slot min-w-0">
          <SubpagePhoto page={page} />
        </div>
      </div>
    </section>
  );
}
