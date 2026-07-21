import { team, values } from "@/content/site";
import { PersonalitySlider } from "@/components/personality-slider";

export function Culture() {
  return (
    <section
      id="culture"
      className="scroll-mt-24 bg-tangerine px-5 py-20 text-ink md:px-8 md:py-32"
    >
      <p className="font-display text-sm tracking-[0.2em] opacity-80">03 — Culture</p>
      <h2 lang="en" className="font-display mt-4 text-[clamp(2.25rem,9vw,7rem)]">
        Big ideas. Bigger feelings.
      </h2>

      <div className="mt-14 grid gap-12 md:mt-20 md:grid-cols-2">
        {team.map((member) => (
          <article key={member.name}>
            <h3 className="font-display text-[clamp(1.75rem,5vw,3.25rem)]">{member.name}</h3>
            <p className="font-display mt-1 text-sm uppercase tracking-wide text-ink/80">
              {member.role}
            </p>
            <p className="mt-3 max-w-prose text-lg leading-relaxed">{member.bio}</p>
          </article>
        ))}
      </div>

      <PersonalitySlider />

      <p className="font-display mt-16 text-xl md:mt-24 md:text-3xl">
        {values.join("  ·  ")}
      </p>
    </section>
  );
}
