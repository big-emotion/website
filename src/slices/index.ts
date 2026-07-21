/**
 * Slice components map consumed by `<SliceZone>`. Keys are the slice API IDs
 * (snake_case) declared in each `model.json`.
 *
 * Every new shared slice must be registered here, or `<SliceZone>` renders
 * nothing for it.
 */
import ArticleSection from "./ArticleSection";
import CaseChapter from "./CaseChapter";

export const components = {
  case_chapter: CaseChapter,
  article_section: ArticleSection,
};
