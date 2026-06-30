import { Hero } from "@/components/hero";
import { manifesto } from "@/content/site";

// Phase 2 vertical slice: hero + a manifesto band + anchored section stubs so the nav
// resolves end to end. Phase 3 replaces the stub bodies with real Approach / Cases /
// Culture content (sourced from the old site + brand book).
export default function Home() {
  return (
    <>
      <Hero />

      <section aria-label="Manifeste" className="overflow-hidden bg-ink py-6 text-lemon">
        <div className="marquee-track flex w-max">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0">
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

      <SectionStub
        id="approach"
        index="01"
        title="Approach"
        line="Digital is the medium. Emotion is the message."
        className="bg-paper text-ink"
      />
      <SectionStub
        id="cases"
        index="02"
        title="Cases & Impact"
        line="We build what people remember."
        className="bg-lyon text-paper"
      />
      <SectionStub
        id="culture"
        index="03"
        title="Culture"
        line="Big ideas. Bigger feelings."
        className="bg-tangerine text-ink"
      />
    </>
  );
}

function SectionStub({
  id,
  index,
  title,
  line,
  className,
}: {
  id: string;
  index: string;
  title: string;
  line: string;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`flex min-h-[70svh] flex-col justify-center px-5 py-20 md:px-8 ${className ?? ""}`}
    >
      <span className="font-display text-sm opacity-60">{index}</span>
      <h2 className="font-display mt-2 text-[clamp(2.5rem,9vw,8rem)]">{title}</h2>
      <p className="mt-4 max-w-2xl text-lg md:text-2xl">{line}</p>
    </section>
  );
}
