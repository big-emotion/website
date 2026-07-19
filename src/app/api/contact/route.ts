import { handleContact } from "./handler";

// nodemailer needs Node APIs — pin the route to the Node.js runtime, not Edge.
export const runtime = "nodejs";

export function POST(request: Request): Promise<Response> {
  return handleContact(request);
}
