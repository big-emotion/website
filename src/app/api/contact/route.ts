import { handleContact } from "./handler";

// Pin to the Node.js runtime: the per-IP throttle and the Graph token cache are
// in-memory, so they rely on the standalone server's persistent process, not Edge.
export const runtime = "nodejs";

export function POST(request: Request): Promise<Response> {
  return handleContact(request);
}
