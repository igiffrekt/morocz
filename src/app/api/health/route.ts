export const dynamic = "force-dynamic";

// Build ID is baked in at build time — changes on each `next build`
const BUILD_ID = process.env.BUILD_ID ?? Date.now().toString();

export function GET() {
  return Response.json({ ok: true, buildId: BUILD_ID });
}
