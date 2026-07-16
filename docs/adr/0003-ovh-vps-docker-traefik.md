# 0003 — Move hosting to the OVH VPS: Apache+PHP container behind Traefik

- Status: accepted
- Date: 2026-07-16

## Context

The domain and DNS zone moved from the n0c shared host to the owner's OVH VPS
(51.195.82.98). The zone was recreated with OVH defaults, which broke both the
site (A records pointing at an empty shared cluster, dead 443) and inbound
mail (MX pointing at OVH instead of the Microsoft 365 tenant that hosts
`@big-emotion.com`). The VPS already runs Traefik v2.11 in Docker, which owns
ports 80/443 and routes other production services, so a host-level Apache was
not an option.

## Decision

- **Serve the site from a Docker container (`php:8.3-apache`) routed by the
  existing Traefik** (files in `deploy/`): the same Apache serving model as
  n0c, so the exported `.htaccess` and `contact.php` keep working unchanged.
- **TLS stays with Traefik's ACME resolver** (HTTP-01 challenge); no certbot.
- **Build on the VPS**: the repo is cloned at `/home/ubuntu/big-emotion/website`
  (read-only deploy key). `deploy/deploy.sh` runs git pull + pnpm build, then
  rsyncs `out/` into the bind-mounted `live/` web root — a failed build never
  touches the live site.
- **Contact-form mail = direct send** to the Microsoft 365 MX endpoint on
  port 25 (open on this VPS), via msmtp acting as the container's sendmail.
  PHP `mail()` in `contact.php` is untouched and no SMTP credentials exist on
  the server. Direct send only delivers to the tenant's own mailboxes — which
  is exactly the contact-form case. SPF carries `ip4:51.195.82.98` so these
  sends pass.
- **`mod_remoteip` restores the real client IP** from `X-Forwarded-For`
  (only Traefik can reach the container), keeping `contact.php`'s per-IP rate
  limit meaningful behind the proxy.

## Consequences

- The PHP 7.4 ceiling from n0c is gone (the container runs PHP 8.3). We keep
  `contact.php` dependency-free rather than 7.4-compatible by policy.
- Deploy = SSH to the VPS and run `/home/ubuntu/big-emotion/deploy.sh`.
- Direct send relies on Microsoft accepting unauthenticated mail addressed to
  its own tenant (the default today, but increasingly discouraged). If
  Microsoft closes it, switch `.env` on the VPS to an authenticated relay —
  the msmtp entrypoint already supports both modes.
- Supersedes ADR 0001's "host on n0c" decision (the static-export decision
  stands). ADR 0002's SPF/DKIM/DMARC owner actions now target the OVH DNS
  zone + Microsoft 365.
