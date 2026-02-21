import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

const typeToTags: Record<string, string[]> = {
  homepage: ["homepage"],
  siteSettings: ["siteSettings"],
  service: ["service"],
  serviceCategory: ["serviceCategory"],
  labTest: ["labTest"],
  testimonial: ["testimonial"],
  blogPost: ["blogPost"],
  blogCategory: ["blogCategory"],
  privacyPolicy: ["privacyPolicy"],
};

export async function POST(request: Request) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;

  if (!secret) {
    return NextResponse.json({ message: "Webhook secret not configured" }, { status: 500 });
  }

  const rawBody = await request.text();

  const signature = request.headers.get("x-sanity-signature");

  if (!signature) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  const expectedHmac = createHmac("sha256", secret).update(rawBody).digest("hex");

  let isValid = false;
  try {
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedHmac, "hex");
    if (sigBuffer.length === expectedBuffer.length) {
      isValid = timingSafeEqual(sigBuffer, expectedBuffer);
    }
  } catch {
    isValid = false;
  }

  if (!isValid) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  let body: { _type?: string; _id?: string };
  try {
    body = JSON.parse(rawBody) as { _type?: string; _id?: string };
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const docType = body._type;

  if (!docType) {
    return NextResponse.json({ message: "Missing _type in body" }, { status: 400 });
  }

  const tags = typeToTags[docType];

  if (!tags) {
    console.log(
      `[revalidate] Unrecognized Sanity document type: ${docType} — skipping revalidation`,
    );
    return NextResponse.json({ revalidated: false, tags: [], type: docType }, { status: 200 });
  }

  for (const tag of tags) {
    revalidateTag(tag);
  }

  return NextResponse.json({ revalidated: true, tags, type: docType }, { status: 200 });
}
