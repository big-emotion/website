import { ContactForm } from "@/components/contact-form";
import { StackedHeadline } from "@/components/stacked-headline";
import { content, site, socialHandle } from "@/content/site";
import type { Locale } from "@/i18n/locales";

// The /contact route (SWBE-21). This used to be the footer, which the layout renders on
// every page — the form and the contact details now live on the one route that is about
// them. Kept on lemon, so the page still runs into the footer without a seam.
export function Contact({ locale }: { locale: Locale }) {
  const { contact } = content[locale];

  return (
    <section className="bg-lemon px-5 pt-20 pb-16 text-ink md:px-8 md:pt-32 md:pb-24">
      <StackedHeadline
        as="h1"
        lines={contact.title}
        className="font-display text-[clamp(2.5rem,9vw,7rem)]"
      />

      <div className="mt-12 grid gap-12 md:mt-20 md:grid-cols-2 md:gap-16">
        <div className="space-y-8">
          <p className="max-w-prose text-lg leading-relaxed md:text-xl">{contact.lead}</p>
          <p className="max-w-sm text-lg md:text-xl">{contact.responseTime}</p>
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
            <li className="py-1">
              {socialHandle} {contact.socialSuffix}
            </li>
          </ul>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
