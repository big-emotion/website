import { sendMail } from "./mail";

export type ContactSubmission = {
  name: string;
  email: string;
  message: string;
};

// The team's shared inbox; the sending mailbox is the shared Graph MAIL_SENDER.
const RECIPIENT = "hello@big-emotion.com";

// Collapse to a single line so a submitted value can't smuggle structure into
// the subject or the reply-to display name.
function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

// Render visitor text as text, not markup, in the HTML notification body.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildContactMail(submission: ContactSubmission) {
  const name = singleLine(submission.name);
  const email = singleLine(submission.email);
  return {
    to: RECIPIENT,
    // Hitting "reply" answers the visitor, not the shared sending mailbox.
    replyTo: { address: email, name },
    subject: `Nouveau message de ${name} — big-emotion.com`,
    html: `<p><strong>Nom :</strong> ${escapeHtml(name)}</p>
<p><strong>E-mail :</strong> ${escapeHtml(email)}</p>
<p><strong>Message :</strong></p>
<p>${escapeHtml(submission.message).replace(/\n/g, "<br>")}</p>`,
  };
}

export async function sendContactEmail(
  submission: ContactSubmission,
  send: typeof sendMail = sendMail,
): Promise<void> {
  await send(buildContactMail(submission));
}
