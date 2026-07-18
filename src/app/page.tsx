import { Hero } from "@/components/hero";
import { SceneCanvas } from "@/components/scene/scene-canvas";
import { Approach } from "@/components/sections/approach";
import { Cases } from "@/components/sections/cases";
import { Culture } from "@/components/sections/culture";
import { manifesto } from "@/content/site";

// Single-page scroll site, matching the brand book's website mock: hero, then the four
// sections (Contact is the footer). Content lives in src/content/site.ts.
//
// SceneCanvas is a fixed, full-viewport underlay (see docs/adr/0005) — it renders
// behind the Hero (which has no background of its own) and is naturally covered by
// each section's own opaque background further down, so it never fights their colors.
export default function Home() {
  return (
    <>
      <SceneCanvas />
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
