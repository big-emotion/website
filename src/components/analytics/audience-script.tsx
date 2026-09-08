import { audienceMeasurement } from "@/lib/plausible";

/**
 * The one script this site serves that it did not write.
 *
 * It is not a third-party request: `stats.big-emotion.com` is BIG EMOTION's own Plausible
 * instance, on the same VPS and behind the same Traefik as the page asking for it. No
 * cookie is set, no identifier is stored, nothing is shared onward — which is why it sits
 * outside the consent manager rather than inside it, and why `CONSENT_SERVICES` stays
 * empty. `docs/adr/0011-first-party-audience-measurement.md` carries the reasoning and the
 * conditions that would end it.
 *
 * A plain `<script>` rather than `next/script`: this renders on the server into a static
 * page, exactly like the JSON-LD block beside it in the layout, and the component adds no
 * client bundle of its own.
 *
 * It is mounted on the marketing tree only. `/espace` carries the client id in its path,
 * so measuring it would file one identifiable client's visits under a readable URL — an
 * audience measurement that stops being anonymous is no longer the exempt kind.
 */
export function AudienceScript() {
  const measurement = audienceMeasurement();
  if (!measurement) return null;

  return <script defer data-domain={measurement.domain} src={measurement.scriptSrc} />;
}
