import { handleGetCounter, handlePostCounter } from "./handler";

// Pin to the Node.js runtime: the persistence lib writes to the filesystem and the
// rate limiter is in-memory, so this needs the standalone server's persistent
// process, not Edge.
export const runtime = "nodejs";

export function GET(): Promise<Response> {
  return handleGetCounter();
}

export function POST(request: Request): Promise<Response> {
  return handlePostCounter(request);
}
