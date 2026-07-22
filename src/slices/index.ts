/**
 * Slice components map consumed by `<SliceZone>`. Keys are the slice API IDs
 * (snake_case) declared in each `model.json`. Every new shared slice must be
 * registered here, or `<SliceZone>` renders nothing for it.
 */
import ArticleSection from "./ArticleSection";
import CaseChapter from "./CaseChapter";
import HomeScene from "./HomeScene";
import PipelineBoard from "./PipelineBoard";

export const components = {
  case_chapter: CaseChapter,
  home_scene: HomeScene,
  article_section: ArticleSection,
  pipeline_board: PipelineBoard,
};
