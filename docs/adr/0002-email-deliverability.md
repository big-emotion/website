# 0002 — Contact form email deliverability

- Status: accepted
- Date: 2026-07-01

## Context

The contact form posts to `public/contact.php`, which sends mail via PHP `mail()` on the
n0c host. `mail()` alone routinely lands in spam: without an aligned envelope sender and
DNS authentication, mailbox providers fail SPF/DKIM/DMARC and downrank or reject.

## Decision

- `contact.php` passes an **envelope sender** (`-f contact@big-emotion.com`) so the
  Return-Path aligns with the `From:` domain instead of the n0c system user.
- The recipient is hardcoded (not an open relay); the visitor's address is only ever a
  `Reply-To`. All header values are CR/LF-stripped against header injection.
- Abuse is bounded by a honeypot plus a per-IP file-based rate limit (no database).

## Required DNS (cannot be done in code — owner action on the big-emotion.com zone)

1. **SPF**: authorize the n0c outbound mail host, e.g.
   `v=spf1 include:_spf.n0c.com -all` (confirm the exact include with n0c support).
2. **DKIM**: enable DKIM signing for big-emotion.com in the n0c panel and publish the
   provided selector record.
3. **DMARC**: start at `v=DMARC1; p=none; rua=mailto:postmaster@big-emotion.com` to
   monitor, then tighten to `quarantine`/`reject` once SPF+DKIM pass consistently.

## Consequences

- Until the DNS records exist, deliverability is best-effort; the envelope sender helps
  but is not sufficient on its own.
- If deliverability proves unreliable on shared hosting, switch `contact.php` to an
  authenticated SMTP relay (e.g. a transactional provider) — a localized change behind
  the same form contract.
