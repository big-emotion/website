// Transactional mail via Microsoft Graph (OAuth2 client credentials). This is
// the one shared send path for every transactional mail: magic links (SWBE-27),
// escalation forwards (SWBE-30), the contact relay (SWBE-31). It sends as
// MAIL_SENDER (a licensed M365 mailbox) through POST /users/{sender}/sendMail —
// the same tenant app the support-agent portal uses, so one set of server
// secrets covers both sites. Server-only: GRAPH_CLIENT_SECRET must never reach a
// client bundle.
//
// With no Graph credentials configured, sends fall back to a dev/test stub that
// logs and resolves, so local login and the contact form work without a tenant.
// A production process without credentials throws rather than silently drop mail.

export interface MailReplyTo {
  address: string;
  name?: string;
}

export interface MailMessage {
  to: string;
  subject: string;
  // Supply text or html (html wins when both are set).
  text?: string;
  html?: string;
  replyTo?: MailReplyTo;
  // Per-call sending mailbox, defaulting to MAIL_SENDER (the portal identity).
  // Graph application permissions require From to equal the mailbox in the
  // sendMail URL, so both move together (REQ-031: contact sends as hello@,
  // portal sends keep MAIL_SENDER/espace@).
  sender?: string;
}

// The portal standardised on GRAPH_TENANT_ID; this repo's first .env.example used
// AZURE_TENANT_ID. Accept either so a shared server can set one and both read it.
function tenantId(): string | undefined {
  return process.env.GRAPH_TENANT_ID ?? process.env.AZURE_TENANT_ID;
}

function graphConfigured(): boolean {
  return Boolean(
    tenantId() &&
      process.env.GRAPH_CLIENT_ID &&
      process.env.GRAPH_CLIENT_SECRET &&
      process.env.MAIL_SENDER,
  );
}

interface CachedToken {
  value: string;
  expiresAt: number;
}

// One app-only token serves every send until it nears expiry. Module-scoped so a
// warm instance reuses it instead of minting one per email.
let cachedToken: CachedToken | null = null;

async function getAccessToken(): Promise<string> {
  const tenant = tenantId();
  const clientId = process.env.GRAPH_CLIENT_ID;
  const clientSecret = process.env.GRAPH_CLIENT_SECRET;
  if (!tenant || !clientId || !clientSecret) {
    throw new Error(
      "GRAPH_TENANT_ID (or AZURE_TENANT_ID), GRAPH_CLIENT_ID and GRAPH_CLIENT_SECRET must be set",
    );
  }
  // Refresh ~60s before expiry so an in-flight send never races the deadline.
  if (cachedToken && cachedToken.expiresAt - 60_000 > Date.now()) {
    return cachedToken.value;
  }

  const response = await fetch(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Graph token request failed: ${response.status} ${await response.text()}`,
    );
  }
  const json = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return cachedToken.value;
}

async function sendViaGraph(message: MailMessage): Promise<void> {
  const sender = message.sender ?? process.env.MAIL_SENDER;
  if (!sender) throw new Error("MAIL_SENDER is not set");
  // Application permissions require From to equal the mailbox in the URL; the
  // optional display name is cosmetic.
  const displayName = process.env.MAIL_FROM_NAME;
  const from = {
    emailAddress: displayName ? { address: sender, name: displayName } : { address: sender },
  };
  const body = message.html
    ? { contentType: "HTML", content: message.html }
    : { contentType: "Text", content: message.text ?? "" };

  const graphMessage = {
    subject: message.subject,
    body,
    toRecipients: [{ emailAddress: { address: message.to } }],
    from,
    ...(message.replyTo && {
      replyTo: [{ emailAddress: { address: message.replyTo.address, name: message.replyTo.name } }],
    }),
  };

  const token = await getAccessToken();
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      // The transactional pilot has no need to keep a Sent Items copy.
      body: JSON.stringify({ message: graphMessage, saveToSentItems: false }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Graph sendMail failed: ${response.status} ${await response.text()}`,
    );
  }
}

export async function sendMail(message: MailMessage): Promise<void> {
  if (!graphConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[mail:stub] to=${message.to} subject=${JSON.stringify(message.subject)}`,
      );
      return;
    }
    throw new Error(
      "sendMail: Microsoft Graph transport is not configured " +
        "(set GRAPH_TENANT_ID/GRAPH_CLIENT_ID/GRAPH_CLIENT_SECRET/MAIL_SENDER)",
    );
  }
  await sendViaGraph(message);
}
