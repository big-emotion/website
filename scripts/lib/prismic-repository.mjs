/**
 * Shared helper for resolving PRISMIC_REPOSITORY_NAME from the environment.
 *
 * Every script that targets a Prismic repository must call this helper instead
 * of reading process.env directly or falling back to a hard-coded name. There is
 * deliberately no in-code default: the write token carried by prismic:push can
 * overwrite a live content model, and a silent fallback would point that write
 * at whichever repository happened to be hardcoded.
 */

/**
 * Returns the value of PRISMIC_REPOSITORY_NAME, or exits the process non-zero
 * with a clear message when the variable is absent or blank.
 *
 * @returns {string}
 */
export function requirePrismicRepository() {
  const repository = process.env.PRISMIC_REPOSITORY_NAME;
  if (!repository || repository.trim() === "") {
    console.error(
      "Error: PRISMIC_REPOSITORY_NAME is not set or is blank.\n" +
        "  Set it in .env (see .env.example) before running this script.\n" +
        "  Example: PRISMIC_REPOSITORY_NAME=big-emotion",
    );
    process.exit(1);
  }
  return repository;
}
