"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Member = {
  name: string;
  role: string;
  bio: string;
  links: readonly { label: string; context: string; href: string }[];
};

function shuffled(members: readonly Member[]): Member[] {
  const result = [...members];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapWith]] = [result[swapWith], result[index]];
  }

  return result;
}

/**
 * The team as two horizontal bands: both carry the full roster, drift in opposite
 * directions and let the member under the cursor swell.
 *
 * Two things about the card width, which is `max(52vw, …)` rather than a plain size.
 * The loop shifts the track by -50%, so it only stays seamless while one half is wider
 * than the viewport — sizing a card off `vw` makes a half (the full roster, 52vw a
 * member) wider than any screen, which holds that guarantee without printing the
 * roster over and over to pad the track. It also makes the scroll rate
 * viewport-proportional: the duration in globals.css is one half's travel time, so it
 * scales with the roster.
 *
 * Every copy after the first row's first half is visual only. It stays inert and out of
 * the accessibility tree, so a screen reader and the Tab key meet each member once.
 */
export function TeamMarquee({ members }: { members: readonly Member[] }) {
  const t = useTranslations("culture");
  const [rows, setRows] = useState<readonly (readonly Member[])[]>([members, members]);

  // The SSG HTML keeps the authored order so hydration is deterministic. Once the
  // browser owns the component, each visual row gets a fresh order on the next frame.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setRows([shuffled(members), shuffled(members)]);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [members]);

  return (
    <div className="team-marquee -mx-5 space-y-10 overflow-hidden md:-mx-8 md:space-y-14">
      {rows.map((row, rowIndex) => {
        const decorativeRow = rowIndex > 0;

        return (
          <div
            key={rowIndex}
            data-decorative={decorativeRow}
            className="team-marquee-row overflow-hidden"
          >
            <div
              className={`marquee-track flex w-max ${decorativeRow ? "marquee-track--reverse" : ""}`}
            >
              {[0, 1].map((copy) => {
                const decorativeCopy = decorativeRow || copy > 0;

                return (
                  <ul
                    key={copy}
                    aria-label={decorativeCopy ? undefined : t("teamListLabel")}
                    aria-hidden={decorativeCopy || undefined}
                    inert={decorativeCopy || undefined}
                    className="flex shrink-0"
                  >
                    {row.map((member) => (
                      <li
                        key={member.name}
                        className="team-marquee-member w-[max(52vw,20rem)] shrink-0 px-5 md:px-8"
                      >
                        <h2 className="font-display text-[clamp(1.75rem,5vw,3.25rem)]">
                          {member.name}
                        </h2>
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
      })}
    </div>
  );
}
