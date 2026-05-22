import { auth } from "@/lib/auth";
import { getWriteClient } from "@/lib/sanity-write-client";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const { bookingId } = (await request.json()) as { bookingId?: string };
    if (!bookingId) return Response.json({ error: "Missing bookingId" }, { status: 400 });

    await getWriteClient()
      .patch(bookingId)
      .set({ status: "no-show" })
      .commit();

    return Response.json({ success: true });
  } catch (err) {
    console.error("[api/admin/booking/no-show]", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
