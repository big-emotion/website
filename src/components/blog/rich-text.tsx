import type { RichTextField } from "@prismicio/client";
import type { JSXMapSerializer, LinkProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
import Image from "next/image";
import { locales } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { linkResolver } from "@/prismicio";

// `linkResolver` (src/prismicio.ts) returns a path already prefixed for the *target*
// document's locale (e.g. "/en/cases/foo/" — see localePath in src/i18n/urls.ts), but
// the locale-aware `Link` prefixes whatever `href` it receives for the locale that is
// *currently* rendering (see cases.tsx, which always passes bare paths like
// "/cases/foo"). Handing the resolver's output to `Link` unchanged would double the
// prefix for a same-locale link viewed on the `/en` route, so it is stripped here.
const LOCALE_PREFIX = new RegExp(`^/(?:${locales.join("|")})(?=/|$)`);

function InternalLink({ href, ...props }: LinkProps) {
  const path = href.replace(LOCALE_PREFIX, "") || "/";
  return <Link href={path} {...props} />;
}

function ExternalLink({ href, children }: LinkProps) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

// Every RichTextField node type the article body can contain, mapped to a plain
// semantic element. Styling comes from the `.article-prose` scope in globals.css
// (SWBE-150) that wraps this output below, rather than per-node utility classes, so a
// new node type only needs a tag here — the type scale already covers it.
const components: JSXMapSerializer = {
  heading2: ({ children }) => <h2>{children}</h2>,
  heading3: ({ children }) => <h3>{children}</h3>,
  heading4: ({ children }) => <h4>{children}</h4>,
  paragraph: ({ children }) => <p>{children}</p>,
  preformatted: ({ children }) => <pre>{children}</pre>,
  strong: ({ children }) => <strong>{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  list: ({ children }) => <ul>{children}</ul>,
  oList: ({ children }) => <ol>{children}</ol>,
  listItem: ({ children }) => <li>{children}</li>,
  oListItem: ({ children }) => <li>{children}</li>,
  // The Prismic-hosted URL is served through imgix (query-param resizing), so it needs
  // no entry in next.config.ts's image domains — the same reason CaseChapter reaches
  // for PrismicNextImage instead of a bare <img>. Real dimensions and alt text always
  // come from Prismic, so next/image never has to guess them.
  image: ({ node }) => (
    <Image
      src={node.url}
      alt={node.alt ?? ""}
      width={node.dimensions.width}
      height={node.dimensions.height}
    />
  ),
};

/**
 * Renders a Prismic `RichTextField` as branded, long-form article body copy.
 *
 * Internal hyperlinks (Document links) go through the app's `linkResolver` and the
 * locale-aware `Link`; anything else (Web/Media links) renders as a plain external
 * anchor. See `InternalLink` above for why the resolved path is stripped before
 * reaching `Link`.
 */
export function ArticleRichText({ field }: { field: RichTextField }) {
  return (
    <div className="article-prose">
      <PrismicRichText
        field={field}
        components={components}
        linkResolver={linkResolver}
        internalLinkComponent={InternalLink}
        externalLinkComponent={ExternalLink}
      />
    </div>
  );
}
