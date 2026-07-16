<?php
/**
 * BIG EMOTION — contact form handler.
 *
 * The site is a static export; this is the one piece of server code, deployed at the
 * web root of the site container (Apache/PHP behind Traefik — see docs/adr/0003).
 * It accepts the contact form POST, validates it, throttles abuse, and emails the
 * message (PHP mail() goes out through the container's msmtp relay).
 *
 * Security notes:
 * - Every value that reaches a mail header (From/Reply-To/Subject) is stripped of CR/LF
 *   to prevent email header injection.
 * - A honeypot field silently absorbs naive bots; a per-IP rate limit caps targeted
 *   scripts that skip the honeypot (mailbomb protection).
 * - mail() is given an envelope sender (-f) so Return-Path aligns with the From domain;
 *   SPF + DKIM for big-emotion.com still need to be set at the DNS level (see ADR 0002).
 * - Replies to fetch() return JSON; plain form posts get a redirect (works without JS).
 */

declare(strict_types=1);

const RECIPIENT       = 'contact@big-emotion.com';
const FROM            = 'BIG EMOTION <contact@big-emotion.com>';
const ENVELOPE_SENDER = 'contact@big-emotion.com';
const MAX_LEN         = 5000;
const MIN_INTERVAL    = 20;   // seconds between two sends from one IP
const MAX_PER_HOUR    = 5;    // sends per IP per hour

/**
 * Bail with the right format for the caller (JSON for AJAX, redirect otherwise).
 * Kept 7.4-compatible from the n0c era (no `str_contains`, no `never` return type):
 * harmless on the container's PHP 8.3, and it keeps the file portable to any host.
 */
function respond(bool $ok, string $message, int $status = 200)
{
    http_response_code($status);
    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
    $wantsJson = (
        (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'fetch')
        || strpos($accept, 'application/json') !== false
    );
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
    } else {
        header('Location: /?sent=' . ($ok ? '1' : '0') . '#contact');
    }
    exit;
}

/** Collapse to a single line so a value can never inject a new mail header. */
function headerSafe(string $value): string
{
    return trim(str_replace(["\r", "\n", "%0a", "%0d"], '', $value));
}

/**
 * File-backed per-IP token bucket. No database: a JSON file per IP in the temp dir
 * holds recent send timestamps. Fails open (allows) if the temp dir is unwritable so
 * a hosting quirk never silently breaks the form.
 */
function rateLimited(): bool
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $file = sys_get_temp_dir() . '/be_contact_' . hash('sha256', $ip);
    $now = time();

    $fh = @fopen($file, 'c+');
    if ($fh === false) {
        return false; // can't track -> don't block legitimate users
    }
    try {
        if (!flock($fh, LOCK_EX)) {
            return false;
        }
        $raw = stream_get_contents($fh);
        $hits = array_values(array_filter(
            is_string($raw) && $raw !== '' ? (json_decode($raw, true) ?: []) : [],
            static fn ($t) => is_int($t) && $t > $now - 3600
        ));

        $tooSoon = !empty($hits) && ($now - max($hits)) < MIN_INTERVAL;
        $tooMany = count($hits) >= MAX_PER_HOUR;
        if ($tooSoon || $tooMany) {
            return true;
        }

        $hits[] = $now;
        ftruncate($fh, 0);
        rewind($fh);
        fwrite($fh, json_encode($hits));
        return false;
    } finally {
        flock($fh, LOCK_UN);
        fclose($fh);
    }
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    respond(false, 'Méthode non autorisée.', 405);
}

// Honeypot: a real user never fills this hidden field. Pretend success to waste the bot.
if (trim((string)($_POST['website'] ?? '')) !== '') {
    respond(true, 'Merci !');
}

if (rateLimited()) {
    respond(false, 'Trop de tentatives. Réessaie dans un instant.', 429);
}

$name    = trim((string)($_POST['name'] ?? ''));
$email   = trim((string)($_POST['email'] ?? ''));
$message = trim((string)($_POST['message'] ?? ''));

if ($name === '' || $email === '' || $message === '') {
    respond(false, 'Tous les champs sont requis.', 422);
}
if (mb_strlen($name) > 200 || mb_strlen($email) > 200 || mb_strlen($message) > MAX_LEN) {
    respond(false, 'Message trop long.', 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Adresse e-mail invalide.', 422);
}

$subject = headerSafe('Nouveau message de ' . $name . ' — big-emotion.com');
$headers = [
    'From: ' . FROM,
    'Reply-To: ' . headerSafe($name) . ' <' . headerSafe($email) . '>',
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
];

$body = "Nom : {$name}\n"
      . "E-mail : {$email}\n\n"
      . "Message :\n{$message}\n";

$sent = @mail(RECIPIENT, $subject, $body, implode("\r\n", $headers), '-f' . ENVELOPE_SENDER);

if ($sent) {
    respond(true, 'Message envoyé. On te répond sous 24 h.');
}
respond(false, "L’envoi a échoué. Écris-nous à " . RECIPIENT . '.', 500);
