import type { Content } from "@prismicio/client";
import { PrismicNextImage } from "@prismicio/next";
import { PrismicRichText } from "@prismicio/react";
import type { SliceComponentProps } from "@prismicio/react";

export type CaseChapterProps = SliceComponentProps<Content.CaseChapterSlice>;

export default function CaseChapter({ slice }: CaseChapterProps) {
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
      <div className="mt-4 max-w-prose text-lg leading-relaxed">
        <PrismicRichText field={slice.primary.body} />
      </div>
      {/* `sizes` mirrors the one-column-then-half-width grid the chapters sit in. */}
      <PrismicNextImage
        field={slice.primary.image}
        sizes="(min-width: 768px) 50vw, 100vw"
        className="mt-6 h-auto w-full"
      />
    </section>
  );
}
