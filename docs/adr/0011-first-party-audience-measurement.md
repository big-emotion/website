# 0011 — Audience measurement runs first-party, outside the consent manager

- Status: accepted
- Date: 2026-09-08

## Context

The site has shipped with no measurement at all. That was defensible while there
was nothing to decide: the pages were a brochure, and a brochure that nobody
measures is still a brochure. It stops being defensible the moment BIG EMOTION
starts publishing — social profiles, a presentation video, a campaign that ends
in a click. Publishing without measurement is not a privacy posture, it is
guessing with extra steps.

Three constraints shaped the choice.

**The site makes no third-party request, on purpose.** Fonts are self-hosted
woff2 files rather than a Google Fonts link. `<PrismicPreview>` was rewritten so
its CDN script loads only inside a draft-mode session. A hosted analytics vendor
would have been the first request to leave the building, and it would have made
the privacy policy's central claim false.

**The consent manager loads on demand.** tarteaucitron is fetched when the footer
button is pressed, not on page load, because nothing on the site needed holding
back. A consent manager that arrives on click cannot gate anything — so any
consent-requiring script forces it to load eagerly on every page, ~320 kB, to
power a panel almost nobody opens. `consent-manager.test.ts` encodes exactly
that: it fails if a service is registered while the on-demand load stands.

**A Plausible Community Edition instance already exists on the same VPS.**
EthniAfrica runs one at `stats.ethniafrica.com` (`/srv/plausible`, its own
compose project on Traefik's `proxy` network). big-emotion.com is served by a
container on that same host. Adding a second property to that instance costs one
dashboard entry and no new infrastructure.

EthniAfrica's own setup gates Plausible behind its consent banner, and pays for
it: its documentation records that every figure counts consented sessions only
and is therefore "a floor of unknown depth, never the audience". That is the
outcome this ADR is written to avoid.

## Decision

- **Measure with the existing self-hosted Plausible instance**, adding
  `big-emotion.com` as a property. No vendor account, no hosted plan, no new
  service on the VPS.
- **Serve the script from a BIG EMOTION host** (`stats.big-emotion.com`, a
  CNAME-free A record onto the same VPS). The request leaves the page but not the
  organisation: same server, same operator, same Traefik, no processor in
  between. The "no third-party request" claim survives, stated honestly.
- **Do not register it in `CONSENT_SERVICES`, and keep the consent manager
  on demand.** Plausible CE sets no cookie, stores no identifier, performs no
  cross-site tracking, and produces aggregate statistics for the publisher alone
  — the technical conditions the CNIL's audience-measurement exemption is written
  against. The exemption tests characteristics, not brand names, so the absence
  of Plausible from the CNIL's published list of evaluated solutions is not a bar.
- **Configure with plain `PLAUSIBLE_DOMAIN` / `PLAUSIBLE_HOST`, not
  `NEXT_PUBLIC_*`.** The tag is emitted by a server component, so no value needs
  to reach the client bundle. Both are still read at _build_ time, because the
  marketing tree is pre-rendered — setting them in the VPS `.env` alone changes
  nothing until the next image build, the same trap `PRISMIC_REPOSITORY_NAME`
  carries.
- **A half-configured build measures nothing.** A domain without a host returns
  `null` rather than falling back to `plausible.io`. The vendor default is the
  one way this decision could silently reverse itself, so the code refuses it.
- **The marketing tree only.** `/espace/:clientId` names a client in its path;
  filing those visits would produce statistics that identify a named client, and
  an audience measurement that is not anonymous is not the exempt kind. The
  `(auth)` layout mounts no script.
- **`outbound-links` is the only extension enabled.** The campaign this
  measurement exists for ends in a click that leaves the site. Every other
  extension answers a question nobody has asked yet.

## Consequences

- The privacy policy now describes the measurement, in both locales, under a
  renamed "Mesure d'audience et cookies" heading. RGPD art. 13 requires the
  information even where art. 82 requires no consent — exemption from consent is
  not exemption from transparency.
- Figures count every visitor, not every consenting visitor. They are comparable
  across time and are not a floor of unknown depth.
- `stats.big-emotion.com` must resolve before the script does anything. Until the
  DNS record and the Plausible property exist, a configured build sends events
  into nothing — visibly, at the network tab, rather than silently.
- The exemption holds only while the conditions do. Enabling cross-site tracking,
  adding a processor, joining this data to anything else, or exporting
  non-anonymous data to a third party ends it and forces the consent route —
  which in turn means registering the service in `CONSENT_SERVICES` and switching
  the consent manager to an eager load.
- The Plausible instance itself is still deployed by hand from `/srv/plausible`
  and lives in EthniAfrica's repository, not this one. Two brands now depend on
  it; that shared ownership is unresolved and is the obvious next decision.
