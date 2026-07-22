import type { Content } from "@prismicio/client";
import { PrismicNextImage } from "@prismicio/next";
import { PrismicRichText } from "@prismicio/react";
import type { SliceComponentProps } from "@prismicio/react";
import { ArticleRichText } from "@/components/blog/rich-text";

export type ArticleSectionProps = SliceComponentProps<Content.ArticleSectionSlice>;

export default function ArticleSection({ slice }: ArticleSectionProps) {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="mt-12 border-t-2 border-paper/40 pt-6 md:mt-16"
    >
      <PrismicRichText
        field={slice.primary.heading}
        components={{
          heading2: ({ children }) => (
            <h2 className="font-display text-[clamp(1.6rem,7vw,3.5rem)] text-lemon [overflow-wrap:anywhere]">
              {children}
            </h2>
          ),
        }}
      />
      <div className="mt-4">
        <ArticleRichText field={slice.primary.body} />
      </div>
      <PrismicNextImage
        field={slice.primary.image}
        sizes="(min-width: 768px) 50vw, 100vw"
        className="mt-6 h-auto w-full"
      />
    </section>
  );
}
