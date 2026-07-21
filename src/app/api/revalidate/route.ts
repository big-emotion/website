import { handlePrismicWebhook } from "./handler";

// Pin to the Node.js runtime: the secret comparison uses node:crypto's timingSafeEqual.
export const runtime = "nodejs";

export function POST(request: Request): Promise<Response> {
  return handlePrismicWebhook(request);
}
