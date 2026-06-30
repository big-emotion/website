import { cases } from "@/content/site";

export function Cases() {
  return (
    <section
      id="cases"
      className="scroll-mt-24 bg-lyon px-5 py-20 text-paper md:px-8 md:py-32"
    >
      <p className="font-display text-sm tracking-[0.2em] opacity-80">02 — Cases &amp; Impact</p>
      <h2 lang="en" className="font-display mt-4 text-[clamp(2.25rem,9vw,7rem)]">
        We build what people remember.
      </h2>

      <div className="mt-14 grid gap-12 md:mt-20 md:grid-cols-2 md:gap-8">
        {cases.map((project) => (
          <article key={project.slug} className="border-t-2 border-paper pt-6">
            <p className="font-display text-sm uppercase tracking-wide opacity-70">
              {project.kind}
            </p>
            <h3 className="font-display mt-2 text-[clamp(1.6rem,7vw,4rem)] text-lemon [overflow-wrap:anywhere]">
              {project.client}
            </h3>
            <p className="mt-4 max-w-prose text-lg leading-relaxed">{project.summary}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <li
                  key={tag}
                  className="border border-paper/40 px-3 py-1 text-xs uppercase tracking-wide"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
