import type { NextRequest } from "next/server";
import { reconcileAllStalePending } from "@/lib/booking-reconciler";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const results = await reconcileAllStalePending();
  const summary = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.action] = (acc[r.action] ?? 0) + 1;
    return acc;
  }, {});

  return Response.json({ count: results.length, summary, results });
}
