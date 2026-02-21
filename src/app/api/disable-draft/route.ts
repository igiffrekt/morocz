import { draftMode } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  (await draftMode()).disable();

  const redirect = request.nextUrl.searchParams.get("redirect") || "/";
  return NextResponse.redirect(new URL(redirect, request.url));
}
