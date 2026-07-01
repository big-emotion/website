import { site } from "@/content/site";

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-center px-5 pt-24 pb-16 md:px-8">
      <h1 lang="en" className="font-display text-[clamp(2.75rem,11vw,11rem)]">
        The <span className="text-tangerine">B!G</span> agency that gives a wow.
      </h1>

      <div className="mt-auto flex items-end justify-between gap-6 pt-12">
        <span className="font-display text-xs tracking-[0.2em] opacity-70">
          Scroll ↓
        </span>
        <p className="max-w-xs text-right text-sm leading-snug md:text-base">
          {site.baseline} Vraie identité, émotion brute.
        </p>
      </div>
    </section>
  );
}
