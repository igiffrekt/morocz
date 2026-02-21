import { draftMode } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const previewSecret = process.env.SANITY_PREVIEW_SECRET;

  if (!previewSecret) {
    return NextResponse.json({ message: "Preview secret not configured" }, { status: 500 });
  }

  if (!secret || secret !== previewSecret) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  (await draftMode()).enable();

  const redirect = request.nextUrl.searchParams.get("redirect") || "/";
  return NextResponse.redirect(new URL(redirect, request.url));
}
