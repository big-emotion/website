import { site } from "@/content/site";
import { ContactForm } from "./contact-form";
import { Wordmark } from "./wordmark";

export function SiteFooter() {
  return (
    <footer id="contact" className="scroll-mt-24 bg-lemon text-ink">
      <div className="px-5 pt-20 pb-10 md:px-8 md:pt-32">
        <p className="font-display text-sm tracking-[0.2em] opacity-60">04 — Contact</p>
        <h2 className="font-display mt-4 text-[clamp(2.5rem,9vw,7rem)]">
          Hey! Parlons impact.
        </h2>

        <div className="mt-12 grid gap-12 md:mt-20 md:grid-cols-2 md:gap-16">
          <div className="space-y-8">
            <p className="max-w-sm text-lg md:text-xl">{site.contact.responseTime}</p>
            <ul className="space-y-1 text-lg md:text-xl">
              <li>
                <a
                  className="inline-block py-1 underline-offset-4 hover:underline"
                  href={`mailto:${site.contact.email}`}
                >
                  {site.contact.email}
                </a>
              </li>
              <li>
                <a
                  className="inline-block py-1 underline-offset-4 hover:underline"
                  href={site.contact.phoneHref}
                >
                  {site.contact.phone}
                </a>
              </li>
              <li className="py-1">{site.contact.social} on socials</li>
            </ul>
            <p className="text-lg md:text-xl">{site.contact.person}</p>
          </div>

          <ContactForm />
        </div>

        {/* Oversized wordmark — the brand's signature footer move. Purely decorative
            here (the brand name is already in the copyright line), so hide it from AT. */}
        <span aria-hidden="true">
          <Wordmark
            stacked={false}
            className="mt-16 block w-full text-[22vw] leading-none md:mt-24 md:text-[16vw]"
          />
        </span>

        <p className="mt-6 text-sm">
          © {new Date().getFullYear()} {site.name}. {site.tagline}
        </p>
      </div>
    </footer>
  );
}
