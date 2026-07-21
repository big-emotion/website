/**
 * Slice components map consumed by `<SliceZone>`. Keys are the slice API IDs
 * (snake_case) declared in each `model.json`.
 *
 * One entry for now: the Prismic pilot (SWBE-24) models a single `case_study`
 * body slice. Every new shared slice must be registered here, or `<SliceZone>`
 * renders nothing for it.
 */
import CaseChapter from "./CaseChapter";

export const components = {
  case_chapter: CaseChapter,
};
