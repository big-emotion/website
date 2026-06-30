import { Hero } from "@/components/hero";
import { Approach } from "@/components/sections/approach";
import { Cases } from "@/components/sections/cases";
import { Culture } from "@/components/sections/culture";
import { manifesto } from "@/content/site";

// Single-page scroll site, matching the brand book's website mock: hero, then the four
// sections (Contact is the footer). Content lives in src/content/site.ts.
export default function Home() {
  return (
    <>
      <Hero />
      <ManifestoBand />
      <Approach />
      <Cases />
      <Culture />
    </>
  );
}

function ManifestoBand() {
  return (
    <section aria-label="Manifeste" className="overflow-hidden bg-ink py-6 text-lemon">
      <div className="marquee-track flex w-max">
        {[0, 1].map((copy) => (
          <ul key={copy} lang="en" aria-hidden={copy === 1} className="flex shrink-0">
            {manifesto.map((line) => (
              <li key={line} className="font-display flex items-center text-3xl md:text-5xl">
                <span className="px-6">{line}</span>
                <span aria-hidden className="text-tangerine">
                  ✶
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
