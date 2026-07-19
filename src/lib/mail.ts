// Transactional mail — stubbed pending SWBE-37 (M365 Graph shared sender,
// espace@big-emotion.com). This is the one shared send path for every
// transactional mail: magic links (SWBE-27), escalation forwards (SWBE-30),
// contact relay (SWBE-31). Keep the exported signature stable so SWBE-37 can
// swap the implementation in without touching any caller.

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

export async function sendMail(message: MailMessage): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.info(
      `[mail:stub] to=${message.to} subject=${JSON.stringify(message.subject)}`,
    );
    return;
  }

  // TODO(SWBE-37): replace with the M365 Graph sender. Production sends are
  // blocked on that story landing (owner decision 2026-07-16).
  throw new Error(
    "sendMail: no production mail transport configured yet (blocked on SWBE-37)",
  );
}
