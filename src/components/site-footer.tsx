import { site } from "@/content/site";
import { Wordmark } from "./wordmark";

export function SiteFooter() {
  return (
    <footer id="contact" className="bg-lemon text-ink">
      <div className="px-5 pt-16 pb-10 md:px-8 md:pt-24">
        <p className="font-display text-2xl md:text-4xl">Hey! Parlons impact.</p>

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <ul className="space-y-1 text-lg md:text-xl">
            <li>
              <a className="underline-offset-4 hover:underline" href={`mailto:${site.contact.email}`}>
                {site.contact.email}
              </a>
            </li>
            <li>
              <a className="underline-offset-4 hover:underline" href={site.contact.phoneHref}>
                {site.contact.phone}
              </a>
            </li>
            <li>{site.contact.social} on socials</li>
          </ul>
          <p className="text-lg md:text-xl">{site.contact.person}</p>
        </div>

        {/* Oversized wordmark, brand's signature footer move */}
        <Wordmark
          stacked={false}
          className="mt-12 block w-full text-[22vw] leading-none md:text-[16vw]"
        />

        <p className="mt-6 text-sm">
          © {new Date().getFullYear()} {site.name}. {site.tagline}
        </p>
      </div>
    </footer>
  );
}
