import { Fragment } from "react";

/**
 * A headline broken across fixed lines — the designer authored these as `<br>` in the
 * preview dictionary, and the copy model keeps them as one entry per line so nothing has
 * to go through `dangerouslySetInnerHTML`.
 *
 * The line break is visual only, so the rendered text still has to read as a sentence:
 * without the whitespace between the block spans, the accessible name of
 * "Derriere / chaque clic, / une emotion" collapses to "Derrierechaque clic,une emotion"
 * and a screen reader announces one run-on word. The space is what separates them; the
 * `block` display is what hides it visually.
 */
export function StackedHeadline({
  lines,
  as: Tag = "h2",
  className,
}: {
  lines: readonly string[];
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <Tag className={className}>
      {lines.map((line, position) => (
        <Fragment key={line}>
          {position > 0 && " "}
          <span className="block">{line}</span>
        </Fragment>
      ))}
    </Tag>
  );
}
