#!/bin/sh
# Writes /etc/msmtprc from the environment at startup, so SMTP settings live
# in the host-side .env file and are never baked into the image.
#
# Two supported modes:
# - Direct send:         SMTP_HOST only, no credentials. Port 25 straight to the
#   recipient tenant's MX; Microsoft only accepts mail for the tenant's own
#   mailboxes this way, which is exactly what the contact form does.
# - Authenticated relay: SMTP_HOST + SMTP_USER + SMTP_PASSWORD (classic 587
#   submission) if we ever switch to a transactional provider.
set -eu

if [ -n "${SMTP_HOST:-}" ]; then
  {
    echo "defaults"
    echo "tls on"
    echo "tls_trust_file /etc/ssl/certs/ca-certificates.crt"
    echo "logfile -"
    echo ""
    echo "account relay"
    echo "host ${SMTP_HOST}"
    echo "port ${SMTP_PORT:-587}"
    echo "from ${MAIL_FROM:?MAIL_FROM is required when SMTP_HOST is set}"
    if [ -n "${SMTP_USER:-}" ]; then
      echo "auth on"
      echo "user ${SMTP_USER}"
      echo "password ${SMTP_PASSWORD:?SMTP_PASSWORD is required when SMTP_USER is set}"
    else
      echo "auth off"
    fi
    echo ""
    echo "account default : relay"
  } > /etc/msmtprc
  # PHP (www-data) must be able to read it; keep it hidden from "other".
  chown root:www-data /etc/msmtprc
  chmod 640 /etc/msmtprc
else
  # Fail open: the site must still serve if mail isn't configured yet.
  # contact.php already answers a clean 500 when mail() fails.
  echo "WARNING: SMTP_HOST not set - contact form mail is disabled" >&2
fi

exec "$@"
