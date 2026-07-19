// Static, code-defined client registry: the source of truth for the provisioned
// auth allowlist. No database, no admin UI (out of scope for Portal 2) — a new
// client means a code change + deploy.

export interface ClientConfig {
  clientId: string;
  emails: string[];
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Fails fast at module load if the registry is malformed (empty clientId,
// missing/blank emails, or an email provisioned for more than one client).
export function validateClientRegistry(clients: ClientConfig[]): void {
  const seenEmails = new Set<string>();

  for (const client of clients) {
    if (!client.clientId.trim()) {
      throw new Error("clients registry: clientId must not be empty");
    }

    if (client.emails.length === 0) {
      throw new Error(
        `clients registry: client "${client.clientId}" has no provisioned emails`,
      );
    }

    for (const email of client.emails) {
      const normalized = normalizeEmail(email);

      if (!normalized) {
        throw new Error(
          `clients registry: client "${client.clientId}" has a blank email`,
        );
      }

      if (seenEmails.has(normalized)) {
        throw new Error(
          `clients registry: duplicate email "${normalized}" provisioned for more than one client`,
        );
      }

      seenEmails.add(normalized);
    }
  }
}

// TODO(owner): replace with the Grande Chancellerie's real provisioned editor
// emails before production sign-in is relied upon (SWBE-27 ships the mechanism,
// not the client roster).
const clients: ClientConfig[] = [
  {
    clientId: "chancellerie",
    emails: ["contact@big-emotion.com"],
  },
];

validateClientRegistry(clients);

const emailToClientId = new Map<string, string>(
  clients.flatMap((client) =>
    client.emails.map(
      (email) => [normalizeEmail(email), client.clientId] as const,
    ),
  ),
);

export function isAllowedEmail(email: string): boolean {
  return emailToClientId.has(normalizeEmail(email));
}

export function clientIdForEmail(email: string): string | null {
  return emailToClientId.get(normalizeEmail(email)) ?? null;
}
