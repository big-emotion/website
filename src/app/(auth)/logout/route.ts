import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/session";

export async function POST(request: NextRequest): Promise<NextResponse> {
  await destroySession();
  return NextResponse.redirect(new URL("/login", request.url));
}
