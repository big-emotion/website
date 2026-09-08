/**
 * Where the audience-measurement script comes from, and whether it is served at all.
 *
 * The instance is BIG EMOTION's own — Plausible Community Edition on the same OVH VPS
 * that serves this site, behind the same Traefik. That is what lets the site keep its
 * posture of making no third-party request while still being measured, and it is also
 * what puts the measurement inside the CNIL's audience exemption rather than behind a
 * consent banner. See `docs/adr/0011-first-party-audience-measurement.md`.
 *
 * Both variables are read while the marketing tree is pre-rendered, so they must exist in
 * the *build* environment. Setting them in the VPS `.env` alone changes nothing until the
 * next image build — the same trap `PRISMIC_REPOSITORY_NAME` carries.
 */

/**
 * Extensions change what the script can record on its own. `outbound-links` is here
 * because the campaign this measurement exists for ends in a click that leaves the site —
 * to a social profile, to a client. Without it that click is invisible, and "did anyone
 * act on the video" has no answer. Nothing else is enabled: an extension with no question
 * behind it is data collected for its own sake.
 */
const SCRIPT_PATH = "/js/script.outbound-links.js";

export type AudienceMeasurement = {
  /** The property the events are filed under, as registered in the dashboard. */
  domain: string;
  scriptSrc: string;
};

function configured(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/**
 * The measurement to install, or `null` when this build has none.
 *
 * Both halves are required. A domain without a host is a half-finished configuration, and
 * the tempting default — the vendor's hosted instance — would turn a first-party
 * measurement into a transfer to a third party without anyone editing a line of code.
 *
 * @req REQ-051
 */
export function audienceMeasurement(): AudienceMeasurement | null {
  const domain = configured("PLAUSIBLE_DOMAIN");
  const host = configured("PLAUSIBLE_HOST");
  if (!domain || !host) return null;

  return { domain, scriptSrc: `${host.replace(/\/$/, "")}${SCRIPT_PATH}` };
}
