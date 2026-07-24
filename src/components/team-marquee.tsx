import { useTranslations } from "next-intl";

type Member = {
  name: string;
  role: string;
  bio: string;
  links: readonly { label: string; context: string; href: string }[];
};

/**
 * The founders as a slow horizontal band: the roster drifts past and the member under
 * the cursor swells.
 *
 * Two things about the card width, which is `max(52vw, …)` rather than a plain size.
 * The loop shifts the track by -50%, so it only stays seamless while one half is wider
 * than the viewport — sizing a card off `vw` makes a half (two founders) 104vw at every
 * breakpoint, which holds that guarantee without printing the roster over and over to
 * pad the track. It also makes the scroll rate viewport-proportional: one duration
 * moves the band by roughly one screenful whatever the screen.
 *
 * The second half is the same two people again, printed for the loop alone — it is
 * inert and out of the accessibility tree, so a screen reader and the Tab key meet each
 * founder once.
 */
export function TeamMarquee({ members }: { members: readonly Member[] }) {
  const t = useTranslations("culture");

  return (
    <div className="team-marquee -mx-5 overflow-hidden md:-mx-8">
      <div className="marquee-track flex w-max">
        {[0, 1].map((half) => {
          const repeat = half > 0;
          return (
            <ul
              key={half}
              aria-label={repeat ? undefined : t("teamListLabel")}
              aria-hidden={repeat || undefined}
              inert={repeat || undefined}
              className="flex shrink-0"
            >
              {members.map((member) => (
                <li
                  key={member.name}
                  className="team-marquee-member w-[max(52vw,20rem)] shrink-0 px-5 md:px-8"
                >
                  <h2 className="font-display text-[clamp(1.75rem,5vw,3.25rem)]">{member.name}</h2>
                  <div className="team-marquee-details">
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
                  </div>
                </li>
              ))}
            </ul>
          );
        })}
      </div>
    </div>
  );
}
