import nodemailer, { type Transporter } from "nodemailer";

export type ContactSubmission = {
  name: string;
  email: string;
  message: string;
};

// The slice of nodemailer we depend on — narrow enough that a test can pass a
// fake and assert what would be sent without opening an SMTP connection.
export type MailTransport = Pick<Transporter, "sendMail">;

const RECIPIENT = "contact@big-emotion.com";
const FROM = `BIG EMOTION <${RECIPIENT}>`;
// Envelope sender (Return-Path) aligned with the From domain so SPF/DKIM pass
// (ADR 0002/0003). Kept identical to the retired public/contact.php.
const ENVELOPE_SENDER = RECIPIENT;

// Collapse to a single line so a submitted value can never inject a mail header.
function headerSafe(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export function buildContactMessage(submission: ContactSubmission) {
  const name = headerSafe(submission.name);
  const email = headerSafe(submission.email);
  return {
    from: FROM,
    to: RECIPIENT,
    replyTo: `${name} <${email}>`,
    envelope: { from: ENVELOPE_SENDER, to: RECIPIENT },
    subject: `Nouveau message de ${name} — big-emotion.com`,
    text: `Nom : ${name}\nE-mail : ${email}\n\nMessage :\n${submission.message}\n`,
  };
}

// Built lazily from env so importing this module never opens a connection.
// M365 SMTP AUTH on 587/STARTTLS; if the tenant disables basic auth, swap this
// for a Microsoft Graph sendMail transport behind the same MailTransport seam
// (see the SWBE-31 refinement / SWBE-26 ADR).
let m365Transport: MailTransport | undefined;
function defaultTransport(): MailTransport {
  if (!m365Transport) {
    m365Transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.office365.com",
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      requireTLS: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return m365Transport;
}

export async function sendContactEmail(
  submission: ContactSubmission,
  transport: MailTransport = defaultTransport(),
): Promise<void> {
  await transport.sendMail(buildContactMessage(submission));
}
